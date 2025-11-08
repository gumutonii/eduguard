import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  BellIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { apiClient } from '@/lib/api'
import type { Student, Attendance, Performance, RiskFlag, Intervention } from '@/types'
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

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [showSendAlert, setShowSendAlert] = useState(false)
  const queryClient = useQueryClient()

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.getStudent(id!),
    enabled: !!id,
  })

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

  const student = studentData?.data
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
                    <p className="text-neutral-900">{new Date(student.dob || '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Age</p>
                    <p className="text-neutral-900">
                      {student.dob ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years old
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Class</p>
                    <p className="text-neutral-900">{student.classId?.className || student.className || 'Not assigned'}</p>
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
                    <p className="text-sm font-medium text-neutral-600">First Name</p>
                    <p className="text-neutral-900">{student.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Last Name</p>
                    <p className="text-neutral-900">{student.lastName}</p>
                  </div>
                </div>
                {student.middleName && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Middle Name</p>
                    <p className="text-neutral-900">{student.middleName}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Gender</p>
                    <p className="text-neutral-900">{student.gender === 'M' ? 'Male' : 'Female'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Age</p>
                    <p className="text-neutral-900">{student.age} years old</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600">Date of Birth</p>
                  <p className="text-neutral-900">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600">Student ID</p>
                  <p className="text-neutral-900 font-mono text-sm">{student.studentId}</p>
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
                    <p className="text-sm font-medium text-neutral-600">Ubudehe Level</p>
                    <p className="text-neutral-900">{student.socioEconomic?.ubudeheLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Has Parents</p>
                    <p className="text-neutral-900">{student.socioEconomic?.hasParents ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Family Stability</p>
                    <p className="text-neutral-900">{student.socioEconomic?.familyStability ? 'Yes (Stable)' : 'No (Less Stable)'}</p>
                    <p className="text-sm font-medium text-neutral-600 mt-4">Distance to School</p>
                    <p className="text-neutral-900">{student.socioEconomic?.distanceToSchoolKm ? `${student.socioEconomic.distanceToSchoolKm} km` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Number of Siblings</p>
                    <p className="text-neutral-900">{student.socioEconomic?.numberOfSiblings}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-600">Parent Education Level</p>
                  <p className="text-neutral-900">{student.socioEconomic?.parentEducationLevel}</p>
                </div>
                {student.socioEconomic?.parentJob && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Parent Job</p>
                    <p className="text-neutral-900">{student.socioEconomic.parentJob}</p>
                  </div>
                )}
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
                {student.guardianContacts?.map((guardian: any, index: number) => (
                  <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-900">{guardian.name}</h4>
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
                    {guardian.job && (
                      <div className="mt-2">
                        <p className="text-sm text-neutral-600">Job</p>
                        <p className="text-sm text-neutral-900">{guardian.job}</p>
                      </div>
                    )}
                    {guardian.educationLevel && (
                      <div className="mt-2">
                        <p className="text-sm text-neutral-600">Education Level</p>
                        <p className="text-sm text-neutral-900">{guardian.educationLevel}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )

      case 'attendance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceData?.data?.map((attendance: Attendance) => (
                      <div key={attendance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {new Date(attendance.date).toLocaleDateString()}
                          </p>
                          {attendance.notes && (
                            <p className="text-sm text-neutral-600">{attendance.notes}</p>
                          )}
                        </div>
                        <Badge variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'error' : 'warning'}>
                          {attendance.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'performance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {performanceData?.data?.map((performance: Performance) => (
                      <div key={performance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900">{performance.subject}</p>
                          <p className="text-sm text-neutral-600">
                            {performance.term} • {new Date(performance.date).toLocaleDateString()}
                          </p>
                          {performance.notes && (
                            <p className="text-sm text-neutral-500 mt-1">{performance.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-neutral-900">{performance.score}%</p>
                          <Badge variant={performance.score >= 80 ? 'success' : performance.score >= 60 ? 'warning' : 'error'}>
                            {performance.score >= 80 ? 'Excellent' : performance.score >= 60 ? 'Good' : 'Needs Improvement'}
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
                      Class: {student.classId?.className || student.className || 'Not assigned'}
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
              Student ID: {student.studentId || student._id.slice(-8)} • {student.classId?.className || student.className || 'Not assigned'} • {student.gender === 'M' ? 'Male' : 'Female'}
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
