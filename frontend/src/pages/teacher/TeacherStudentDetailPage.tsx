import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  UserIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  MapPinIcon,
  HomeIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { apiClient } from '@/lib/api'
import type { Student, Attendance, Performance, RiskFlag, Intervention } from '@/types'
import DistrictSectorSelect from '@/components/ui/DistrictSectorSelect'
import { getDistricts, getSectorsByDistrict } from '@/lib/rwandaDistrictsSectors'
import { SendAlertModal } from '@/components/SendAlertModal'

const tabs = [
  { id: 'overview', name: 'Overview', icon: UserIcon },
  { id: 'details', name: 'Details', icon: UserIcon },
  { id: 'attendance', name: 'Attendance', icon: ClipboardDocumentCheckIcon },
  { id: 'performance', name: 'Performance', icon: ChartBarIcon },
  { id: 'risk', name: 'Risk Center', icon: ExclamationTriangleIcon },
  { id: 'interventions', name: 'Interventions', icon: ClipboardDocumentListIcon },
  { id: 'report', name: 'Report', icon: DocumentTextIcon },
]

export function TeacherStudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddingAttendance, setIsAddingAttendance] = useState(false)
  const [newAttendanceRecord, setNewAttendanceRecord] = useState<{ studentId: string; date: string; status: string; notes?: string } | null>(null)
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null)
  const [editAttendanceStatus, setEditAttendanceStatus] = useState('')
  const [editAttendanceNotes, setEditAttendanceNotes] = useState('')
  const [isAddingPerformance, setIsAddingPerformance] = useState(false)
  const [newPerformanceRecord, setNewPerformanceRecord] = useState<any>(null)
  const [editingPerformanceId, setEditingPerformanceId] = useState<string | null>(null)
  const [editPerformanceScore, setEditPerformanceScore] = useState(0)
  const [editPerformanceGrade, setEditPerformanceGrade] = useState('C')
  const [editPerformanceRemarks, setEditPerformanceRemarks] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [showSendAlert, setShowSendAlert] = useState(false)
  const queryClient = useQueryClient()

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.getStudent(id!),
    enabled: !!id,
  })

  const student = studentData?.data

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadStudentProfilePicture(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setUploadingPicture(false)
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to upload profile picture')
      setUploadingPicture(false)
    }
  })

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingPicture(true)
    uploadPictureMutation.mutate(file, {
      onSettled: () => {
        e.target.value = '' // Reset input
      }
    })
  }

  // Form setup
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'M',
      dob: '',
      address: {
        district: '',
        sector: '',
        cell: '',
        village: ''
      },
      socioEconomic: {
        ubudeheLevel: 1,
        hasParents: true,
        familyStability: true,
        distanceToSchoolKm: undefined,
        numberOfSiblings: 0
      },
      guardianContacts: [] as any[]
    }
  })

  // Initialize form when student data loads
  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName || '',
        middleName: student.middleName || '',
        lastName: student.lastName || '',
        gender: student.gender || 'M',
        dob: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        address: {
          district: student.address?.district || '',
          sector: student.address?.sector || '',
          cell: student.address?.cell || '',
          village: student.address?.village || ''
        },
        socioEconomic: {
          ubudeheLevel: student.socioEconomic?.ubudeheLevel || 1,
          hasParents: student.socioEconomic?.hasParents ?? true,
          familyStability: student.socioEconomic?.familyStability !== undefined ? student.socioEconomic.familyStability : true,
          distanceToSchoolKm: student.socioEconomic?.distanceToSchoolKm,
          numberOfSiblings: student.socioEconomic?.numberOfSiblings || 0
        },
        guardianContacts: student.guardianContacts?.map((g: any) => ({
          firstName: g.firstName || g.name?.split(' ')[0] || '',
          lastName: g.lastName || g.name?.split(' ').slice(1).join(' ') || '',
          relation: g.relation || '',
          phone: g.phone || '',
          email: g.email || '',
          education: g.education || g.educationLevel || 'None',
          occupation: g.occupation || g.job || '',
          isPrimary: g.isPrimary || false
        })) || []
      })
    }
  }, [student, reset])

  // Update mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateStudent(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setIsEditMode(false)
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      alert(error.message || 'Failed to update student. Please try again.')
    }
  })

  // Attendance mutations
  const createAttendanceMutation = useMutation({
    mutationFn: (data: { studentId: string; date: string; status: string; notes?: string; reason?: string }) =>
      apiClient.createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance', id] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setIsAddingAttendance(false)
      setNewAttendanceRecord(null)
    },
    onError: (error: any) => {
      console.error('Create attendance error:', error)
      alert(error.message || 'Failed to create attendance record. Please try again.')
    }
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ attendanceId, data }: { attendanceId: string; data: { status?: string; notes?: string; reason?: string } }) =>
      apiClient.updateAttendance(attendanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-attendance', id] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setEditingAttendanceId(null)
      setEditAttendanceStatus('')
      setEditAttendanceNotes('')
    },
    onError: (error: any) => {
      console.error('Update attendance error:', error)
      alert(error.message || 'Failed to update attendance record. Please try again.')
    }
  })

  // Performance mutations
  const createPerformanceMutation = useMutation({
    mutationFn: (data: any) => apiClient.createPerformance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-performance', id] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setIsAddingPerformance(false)
      setNewPerformanceRecord(null)
    },
    onError: (error: any) => {
      console.error('Create performance error:', error)
      alert(error.message || 'Failed to create performance record. Please try again.')
    }
  })

  const updatePerformanceMutation = useMutation({
    mutationFn: ({ performanceId, data }: { performanceId: string; data: any }) =>
      apiClient.updatePerformance(performanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-performance', id] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      setEditingPerformanceId(null)
    },
    onError: (error: any) => {
      console.error('Update performance error:', error)
      alert(error.message || 'Failed to update performance record. Please try again.')
    }
  })

  const onSubmit = async (data: any) => {
    try {
      // Calculate age from date of birth
      const dob = new Date(data.dob)
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--
      }

      const updateData = {
        firstName: data.firstName.trim(),
        middleName: data.middleName?.trim() || '',
        lastName: data.lastName.trim(),
        gender: data.gender,
        age: age,
        dob: dob.toISOString(),
        dateOfBirth: dob,
        address: {
          district: data.address.district,
          sector: data.address.sector,
          cell: data.address.cell || '',
          village: data.address.village || ''
        },
        socioEconomic: {
          ubudeheLevel: data.socioEconomic.ubudeheLevel,
          hasParents: typeof data.socioEconomic.hasParents === 'string' 
            ? data.socioEconomic.hasParents === 'true' 
            : Boolean(data.socioEconomic.hasParents),
          familyStability: typeof data.socioEconomic.familyStability === 'string'
            ? data.socioEconomic.familyStability === 'true'
            : Boolean(data.socioEconomic.familyStability),
          distanceToSchoolKm: data.socioEconomic.distanceToSchoolKm ? Number(data.socioEconomic.distanceToSchoolKm) : undefined,
          numberOfSiblings: data.socioEconomic.numberOfSiblings
        },
        guardianContacts: data.guardianContacts.map((contact: any) => ({
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          name: `${contact.firstName.trim()} ${contact.lastName.trim()}`,
          relation: contact.relation,
          email: contact.email && contact.email.trim() !== '' ? contact.email.trim() : undefined,
          phone: contact.phone.trim(),
          education: contact.education,
          educationLevel: contact.education,
          occupation: contact.occupation.trim(),
          job: contact.occupation.trim(),
          isPrimary: contact.isPrimary || false
        }))
      }

      updateStudentMutation.mutate(updateData)
    } catch (error: any) {
      console.error('Error updating student:', error)
      alert(error.message || 'Failed to update student. Please check all fields and try again.')
    }
  }

  const selectedDistrict = watch('address.district')
  const [sectors, setSectors] = useState<string[]>([])

  // Update sectors when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const districtSectors = getSectorsByDistrict(selectedDistrict)
      setSectors(districtSectors)
      if (!watch('address.sector') || !districtSectors.includes(watch('address.sector'))) {
        setValue('address.sector', '')
      }
    }
  }, [selectedDistrict, setValue, watch])

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => apiClient.getStudentAttendance(id!),
    enabled: !!id && activeTab === 'attendance',
  })

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['student-performance', id],
    queryFn: () => apiClient.getStudentPerformance(id!),
    enabled: !!id && activeTab === 'performance',
  })

  const { data: riskFlagsData, isLoading: riskFlagsLoading } = useQuery({
    queryKey: ['student-risk-flags', id],
    queryFn: () => apiClient.getStudentRiskFlags(id!),
    enabled: !!id && activeTab === 'risk',
  })

  const { data: interventionsData, isLoading: interventionsLoading } = useQuery({
    queryKey: ['student-interventions', id],
    queryFn: () => apiClient.getStudentInterventions(id!),
    enabled: !!id && activeTab === 'interventions',
  })

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-16 bg-neutral-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-neutral-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral-900">Student not found</h2>
        <p className="text-neutral-600">The student you're looking for doesn't exist.</p>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Key Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Date of Birth</p>
                    <p className="text-neutral-900">{new Date(student.dateOfBirth || '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Age</p>
                    <p className="text-neutral-900">
                      {student.age || (student.dateOfBirth ? Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A')} years old
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Class</p>
                    <p className="text-neutral-900">{student.classId?.className || student.className || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Student ID</p>
                    <p className="text-neutral-900 font-mono text-sm">{student.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Status</p>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData?.data?.slice(0, 5).map((attendance: Attendance) => (
                    <div key={attendance._id} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {new Date(attendance.date).toLocaleDateString()}
                      </span>
                      <Badge variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'error' : 'warning'}>
                        {attendance.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData?.data?.slice(0, 5).map((performance: Performance) => (
                    <div key={performance._id} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">{performance.subject}</span>
                      <span className="text-sm font-medium text-neutral-900">{performance.score}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'details':
        return (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Student Details</h2>
              <div className="flex items-center space-x-2">
                {isEditMode ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false)
                        reset()
                      }}
                      disabled={updateStudentMutation.isPending}
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateStudentMutation.isPending}
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      {updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditMode(true)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">First Name *</label>
                      {isEditMode ? (
                        <>
                          <input
                            {...register('firstName', { required: 'First name is required', minLength: { value: 2, message: 'First name must be at least 2 characters' } })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Last Name *</label>
                      {isEditMode ? (
                        <>
                          <input
                            {...register('lastName', { required: 'Last name is required', minLength: { value: 2, message: 'Last name must be at least 2 characters' } })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Middle Name</label>
                    {isEditMode ? (
                      <input
                        {...register('middleName')}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-neutral-900 mt-1">{student.middleName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Gender *</label>
                      {isEditMode ? (
                        <>
                          <select
                            {...register('gender', { required: 'Gender is required' })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                          </select>
                          {errors.gender && (
                            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.gender === 'M' ? 'Male' : 'Female'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Date of Birth *</label>
                      {isEditMode ? (
                        <>
                          <input
                            {...register('dob', { required: 'Date of birth is required' })}
                            type="date"
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.dob && (
                            <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Student ID</label>
                    <p className="text-neutral-900 font-mono text-sm mt-1">{student.studentId}</p>
                    <p className="text-xs text-neutral-500 mt-1">Student ID cannot be changed</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditMode ? (
                    <>
                      <DistrictSectorSelect
                        selectedDistrict={watch('address.district')}
                        selectedSector={watch('address.sector')}
                        onDistrictChange={(district) => setValue('address.district', district)}
                        onSectorChange={(sector) => setValue('address.sector', sector)}
                        disabled={false}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-neutral-600">Cell</label>
                          <input
                            {...register('address.cell')}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600">Village</label>
                          <input
                            {...register('address.village')}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">District</p>
                          <p className="text-neutral-900">{student.address?.district}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Sector</p>
                          <p className="text-neutral-900">{student.address?.sector}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Cell</p>
                          <p className="text-neutral-900">{student.address?.cell || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-600">Village</p>
                          <p className="text-neutral-900">{student.address?.village || 'Not specified'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Socio-economic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HomeIcon className="h-5 w-5 mr-2" />
                    Socio-economic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Ubudehe Level *</label>
                      {isEditMode ? (
                        <>
                          <select
                            {...register('socioEconomic.ubudeheLevel', { required: 'Ubudehe level is required', valueAsNumber: true })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                          </select>
                          {errors.socioEconomic?.ubudeheLevel && (
                            <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.ubudeheLevel.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.socioEconomic?.ubudeheLevel}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Number of Siblings *</label>
                      {isEditMode ? (
                        <>
                          <input
                            {...register('socioEconomic.numberOfSiblings', { required: 'Number of siblings is required', valueAsNumber: true, min: { value: 0, message: 'Cannot be negative' }, max: { value: 20, message: 'Cannot exceed 20' } })}
                            type="number"
                            min="0"
                            max="20"
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.socioEconomic?.numberOfSiblings && (
                            <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.numberOfSiblings.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.socioEconomic?.numberOfSiblings}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Has Both Parents *</label>
                      {isEditMode ? (
                        <>
                          <select
                            {...register('socioEconomic.hasParents', { required: 'This field is required' })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                          {errors.socioEconomic?.hasParents && (
                            <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.hasParents.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.socioEconomic?.hasParents ? 'Yes' : 'No'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Family Stability *</label>
                      <p className="text-xs text-neutral-500 mb-1">Is the family/home environment stable?</p>
                      {isEditMode ? (
                        <>
                          <div className="flex space-x-4 mt-2">
                            <label className="flex items-center">
                              <input
                                {...register('socioEconomic.familyStability', { required: 'This field is required' })}
                                type="radio"
                                value="true"
                                className="mr-2"
                              />
                              Yes (Stable)
                            </label>
                            <label className="flex items-center">
                              <input
                                {...register('socioEconomic.familyStability', { required: 'This field is required' })}
                                type="radio"
                                value="false"
                                className="mr-2"
                              />
                              No (Less Stable)
                            </label>
                          </div>
                          {errors.socioEconomic?.familyStability && (
                            <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.familyStability.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.socioEconomic?.familyStability ? 'Yes (Stable)' : 'No (Less Stable)'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600 mt-4">Distance to School (km) *</label>
                      {isEditMode ? (
                        <>
                          <input
                            {...register('socioEconomic.distanceToSchoolKm', { 
                              valueAsNumber: true,
                              required: 'Distance to school is required',
                              min: { value: 0, message: 'Distance cannot be negative' },
                              max: { value: 50, message: 'Distance cannot exceed 50 km' }
                            })}
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            placeholder="e.g., 3.5"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                          />
                          {errors.socioEconomic?.distanceToSchoolKm && (
                            <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.distanceToSchoolKm.message}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-900 mt-1">{student.socioEconomic?.distanceToSchoolKm ? `${student.socioEconomic.distanceToSchoolKm} km` : 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    Guardian Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watch('guardianContacts')?.map((guardian: any, index: number) => (
                    <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                      {isEditMode ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-neutral-600">First Name *</label>
                              <input
                                {...register(`guardianContacts.${index}.firstName`, { required: 'First name is required' })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-neutral-600">Last Name *</label>
                              <input
                                {...register(`guardianContacts.${index}.lastName`, { required: 'Last name is required' })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-neutral-600">Relation *</label>
                              <select
                                {...register(`guardianContacts.${index}.relation`, { required: 'Relation is required' })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Uncle">Uncle</option>
                                <option value="Aunt">Aunt</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Other Relative">Other Relative</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-neutral-600">Phone *</label>
                              <input
                                {...register(`guardianContacts.${index}.phone`, { required: 'Phone is required' })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-neutral-600">Email (Optional)</label>
                              <input
                                {...register(`guardianContacts.${index}.email`)}
                                type="email"
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-neutral-600">Education *</label>
                              <select
                                {...register(`guardianContacts.${index}.education`, { required: 'Education level is required' })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="None">None</option>
                                <option value="Primary">Primary</option>
                                <option value="Secondary">Secondary</option>
                                <option value="University">University</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-neutral-600">Occupation *</label>
                            <input
                              {...register(`guardianContacts.${index}.occupation`, { required: 'Occupation is required' })}
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-neutral-900">{guardian.name || `${guardian.firstName} ${guardian.lastName}`}</h4>
                            {guardian.isPrimary && (
                              <Badge variant="success">Primary</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-neutral-600">Relation</p>
                              <p className="text-neutral-900">{guardian.relation}</p>
                            </div>
                            <div>
                              <p className="text-neutral-600">Phone</p>
                              <p className="text-neutral-900">{guardian.phone}</p>
                            </div>
                          </div>
                          {guardian.email && (
                            <div className="mt-2">
                              <p className="text-sm text-neutral-600">Email</p>
                              <p className="text-sm text-neutral-900">{guardian.email}</p>
                            </div>
                          )}
                          {guardian.occupation && (
                            <div className="mt-2">
                              <p className="text-sm text-neutral-600">Occupation</p>
                              <p className="text-sm text-neutral-900">{guardian.occupation}</p>
                            </div>
                          )}
                          {guardian.education && (
                            <div className="mt-2">
                              <p className="text-sm text-neutral-600">Education</p>
                              <p className="text-sm text-neutral-900">{guardian.education}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </form>
        )

      case 'attendance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Attendance History</CardTitle>
                <Button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    const newAttendance = {
                      studentId: id!,
                      date: today,
                      status: 'PRESENT',
                      notes: ''
                    }
                    // This will be handled by the attendance form below
                    setNewAttendanceRecord(newAttendance)
                    setIsAddingAttendance(true)
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isAddingAttendance && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          if (!newAttendanceRecord) return
                          
                          createAttendanceMutation.mutate({
                            studentId: id!,
                            date: newAttendanceRecord.date,
                            status: newAttendanceRecord.status,
                            notes: newAttendanceRecord.notes || '',
                            reason: newAttendanceRecord.status === 'ABSENT' ? 'NONE' : undefined
                          })
                        }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                              <input
                                type="date"
                                value={newAttendanceRecord?.date || ''}
                                onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord!, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                              <select
                                value={newAttendanceRecord?.status || 'PRESENT'}
                                onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord!, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="PRESENT">Present</option>
                                <option value="ABSENT">Absent</option>
                                <option value="LATE">Late</option>
                                <option value="EXCUSED">Excused</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                              <input
                                type="text"
                                value={newAttendanceRecord?.notes || ''}
                                onChange={(e) => setNewAttendanceRecord({ ...newAttendanceRecord!, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional notes"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-4">
                            <Button type="submit" disabled={createAttendanceMutation.isPending}>
                              {createAttendanceMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                              setIsAddingAttendance(false)
                              setNewAttendanceRecord(null)
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {attendanceLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendanceData?.data && attendanceData.data.length > 0 ? (
                        attendanceData.data.map((attendance: Attendance) => (
                          <div key={attendance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900">
                                {new Date(attendance.date).toLocaleDateString()}
                              </p>
                              {attendance.notes && (
                                <p className="text-sm text-neutral-600">{attendance.notes}</p>
                              )}
                              {(attendance as any).reason && (attendance as any).reason !== 'NONE' && (
                                <p className="text-xs text-neutral-500">Reason: {(attendance as any).reason}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'error' : 'warning'}>
                                {attendance.status}
                              </Badge>
                              {editingAttendanceId === attendance._id ? (
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={editAttendanceStatus}
                                    onChange={(e) => setEditAttendanceStatus(e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  >
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="LATE">Late</option>
                                    <option value="EXCUSED">Excused</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={editAttendanceNotes}
                                    onChange={(e) => setEditAttendanceNotes(e.target.value)}
                                    placeholder="Notes"
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-md w-32"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updateAttendanceMutation.mutate({
                                        attendanceId: attendance._id,
                                        data: {
                                          status: editAttendanceStatus,
                                          notes: editAttendanceNotes
                                        }
                                      })
                                    }}
                                    disabled={updateAttendanceMutation.isPending}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingAttendanceId(null)
                                      setEditAttendanceStatus('')
                                      setEditAttendanceNotes('')
                                    }}
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingAttendanceId(attendance._id)
                                    setEditAttendanceStatus(attendance.status)
                                    setEditAttendanceNotes(attendance.notes || '')
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          No attendance records found. Click "Mark Attendance" to add records.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Performance History</CardTitle>
                <Button
                  onClick={() => {
                    const newPerformance = {
                      studentId: id!,
                      classId: student?.classId?._id || '',
                      subject: '',
                      score: 0,
                      maxScore: 100,
                      term: 'TERM_1',
                      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                      assessmentType: 'EXAM',
                      grade: 'C',
                      remarks: ''
                    }
                    setNewPerformanceRecord(newPerformance)
                    setIsAddingPerformance(true)
                  }}
                >
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  Add Performance
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isAddingPerformance && newPerformanceRecord && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          if (!newPerformanceRecord) return
                          
                          createPerformanceMutation.mutate({
                            studentId: id!,
                            classId: student?.classId?._id || '',
                            subject: newPerformanceRecord.subject,
                            score: Number(newPerformanceRecord.score),
                            maxScore: Number(newPerformanceRecord.maxScore) || 100,
                            term: newPerformanceRecord.term,
                            academicYear: newPerformanceRecord.academicYear,
                            assessmentType: newPerformanceRecord.assessmentType,
                            grade: newPerformanceRecord.grade,
                            remarks: newPerformanceRecord.remarks || ''
                          })
                        }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                              <input
                                type="text"
                                value={newPerformanceRecord.subject || ''}
                                onChange={(e) => setNewPerformanceRecord({ ...newPerformanceRecord, subject: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Mathematics"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Score *</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={newPerformanceRecord.score || 0}
                                onChange={(e) => {
                                  const score = Number(e.target.value)
                                  let grade = 'F'
                                  if (score >= 90) grade = 'A'
                                  else if (score >= 80) grade = 'B'
                                  else if (score >= 70) grade = 'C'
                                  else if (score >= 60) grade = 'D'
                                  else if (score >= 50) grade = 'E'
                                  setNewPerformanceRecord({ ...newPerformanceRecord, score, grade })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                              <select
                                value={newPerformanceRecord.term || 'TERM_1'}
                                onChange={(e) => setNewPerformanceRecord({ ...newPerformanceRecord, term: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="TERM_1">Term 1</option>
                                <option value="TERM_2">Term 2</option>
                                <option value="TERM_3">Term 3</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type *</label>
                              <select
                                value={newPerformanceRecord.assessmentType || 'EXAM'}
                                onChange={(e) => setNewPerformanceRecord({ ...newPerformanceRecord, assessmentType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="EXAM">Exam</option>
                                <option value="TEST">Test</option>
                                <option value="QUIZ">Quiz</option>
                                <option value="ASSIGNMENT">Assignment</option>
                                <option value="PROJECT">Project</option>
                                <option value="FINAL">Final</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                              <select
                                value={newPerformanceRecord.grade || 'C'}
                                onChange={(e) => setNewPerformanceRecord({ ...newPerformanceRecord, grade: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="F">F</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                              <input
                                type="text"
                                value={newPerformanceRecord.remarks || ''}
                                onChange={(e) => setNewPerformanceRecord({ ...newPerformanceRecord, remarks: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Optional remarks"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-4">
                            <Button type="submit" disabled={createPerformanceMutation.isPending}>
                              {createPerformanceMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                              setIsAddingPerformance(false)
                              setNewPerformanceRecord(null)
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {performanceLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {performanceData?.data && performanceData.data.length > 0 ? (
                        performanceData.data.map((performance: Performance) => (
                          <div key={performance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900">{performance.subject}</p>
                              <p className="text-sm text-neutral-600">
                                {performance.term} • {(performance as any).assessmentType || 'EXAM'} • {(performance as any).academicYear || 'N/A'}
                              </p>
                              {(performance as any).remarks && (
                                <p className="text-sm text-neutral-500 mt-1">{(performance as any).remarks}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-neutral-900">{performance.score}%</p>
                                <Badge variant={performance.score >= 80 ? 'success' : performance.score >= 60 ? 'warning' : 'error'}>
                                  Grade: {(performance as any).grade || 'N/A'}
                                </Badge>
                              </div>
                              {editingPerformanceId === performance._id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editPerformanceScore}
                                    onChange={(e) => {
                                      const score = Number(e.target.value)
                                      let grade = 'F'
                                      if (score >= 90) grade = 'A'
                                      else if (score >= 80) grade = 'B'
                                      else if (score >= 70) grade = 'C'
                                      else if (score >= 60) grade = 'D'
                                      else if (score >= 50) grade = 'E'
                                      setEditPerformanceScore(score)
                                      setEditPerformanceGrade(grade)
                                    }}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-md w-20"
                                  />
                                  <select
                                    value={editPerformanceGrade}
                                    onChange={(e) => setEditPerformanceGrade(e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="E">E</option>
                                    <option value="F">F</option>
                                  </select>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updatePerformanceMutation.mutate({
                                        performanceId: performance._id,
                                        data: {
                                          score: editPerformanceScore,
                                          grade: editPerformanceGrade,
                                          remarks: editPerformanceRemarks
                                        }
                                      })
                                    }}
                                    disabled={updatePerformanceMutation.isPending}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingPerformanceId(null)
                                      setEditPerformanceScore(0)
                                      setEditPerformanceGrade('C')
                                      setEditPerformanceRemarks('')
                                    }}
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPerformanceId(performance._id)
                                    setEditPerformanceScore(performance.score)
                                    setEditPerformanceGrade((performance as any).grade || 'C')
                                    setEditPerformanceRemarks((performance as any).remarks || '')
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-neutral-500">
                          No performance records found. Click "Add Performance" to add records.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'risk':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskFlagsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riskFlagsData?.data?.map((riskFlag: RiskFlag) => (
                      <div key={riskFlag._id} className={`p-4 border rounded-xl ${
                        riskFlag.level === 'HIGH' ? 'bg-red-50 border-red-200' :
                        riskFlag.level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${
                              riskFlag.level === 'HIGH' ? 'text-red-800' :
                              riskFlag.level === 'MEDIUM' ? 'text-yellow-800' :
                              'text-green-800'
                            }`}>
                              Risk Level: {riskFlag.level}
                            </p>
                            <p className={`text-sm ${
                              riskFlag.level === 'HIGH' ? 'text-red-600' :
                              riskFlag.level === 'MEDIUM' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              Reasons: {riskFlag.reasons.join(', ')}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              Status: {riskFlag.status} • Created: {new Date(riskFlag.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={riskFlag.level.toLowerCase() as 'low' | 'medium' | 'high'}>
                            {riskFlag.level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'interventions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Intervention History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interventionsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interventionsData?.data?.map((intervention: Intervention) => (
                      <div key={intervention._id} className="p-4 border border-neutral-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{intervention.title}</p>
                            {intervention.description && (
                              <p className="text-sm text-neutral-600 mt-1">{intervention.description}</p>
                            )}
                            <p className="text-xs text-neutral-500 mt-1">
                              Due: {intervention.dueDate ? new Date(intervention.dueDate).toLocaleDateString() : 'No due date'}
                            </p>
                          </div>
                          <Badge variant={intervention.status === 'DONE' ? 'success' : intervention.status === 'PLANNED' ? 'info' : 'error'}>
                            {intervention.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Student Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-neutral-900">Student Summary Report</h3>
                  <p className="text-neutral-600">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <h4 className="font-medium text-neutral-900">Student Information</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      Name: {student.firstName} {student.lastName}<br />
                      Gender: {student.gender === 'M' ? 'Male' : 'Female'}<br />
                      Class: {student.classId?.className || student.className || 'Not assigned'}<br />
                      Student ID: {student.studentId}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <h4 className="font-medium text-neutral-900">Contact Information</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      Guardian: {student.guardianContacts[0]?.name}<br />
                      Phone: {student.guardianContacts[0]?.phone || 'N/A'}<br />
                      Email: {student.guardianContacts[0]?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => window.print()}>
                    Print Report
                  </Button>
                  <Button variant="outline">
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Student Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative group">
            {student.profilePicture ? (
              <img
                src={student.profilePicture}
                alt={`${student.firstName} ${student.lastName}`}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-primary-200"
              />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
            <span className="text-lg sm:text-2xl font-medium text-primary-600">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </span>
              </div>
            )}
            {uploadingPicture && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
              </div>
            )}
            <label className="absolute inset-0 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                disabled={uploadingPicture}
                className="hidden"
              />
              <span className="text-white text-xs font-medium">Upload</span>
            </label>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Student ID: {student.studentId} • {student.classId?.className || student.className || 'Not assigned'} • {student.gender === 'M' ? 'Male' : 'Female'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={student.riskLevel === 'HIGH' || student.riskLevel === 'CRITICAL' ? 'error' : student.riskLevel === 'MEDIUM' ? 'warning' : 'low'}>
            {student.riskLevel || 'LOW'} Risk
          </Badge>
          <Button
            variant="primary"
            onClick={() => setShowSendAlert(true)}
            className="flex items-center gap-2"
          >
            <BellIcon className="h-4 w-4" />
            Send Alert
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>

    {/* Send Alert Modal */}
    {showSendAlert && student && (
      <SendAlertModal
        studentId={student._id}
        studentName={`${student.firstName} ${student.lastName}`}
        guardianName={student.guardianContacts?.[0]?.name}
        guardianPhone={student.guardianContacts?.[0]?.phone}
        guardianEmail={student.guardianContacts?.[0]?.email}
        onClose={() => setShowSendAlert(false)}
        onSuccess={() => {
          alert('Alert sent successfully!')
        }}
      />
    )}
  </div>
  )
}
