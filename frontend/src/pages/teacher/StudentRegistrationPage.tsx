import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  UserIcon, 
  MapPinIcon, 
  HomeIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { getDistricts, getSectorsByDistrict } from '@/lib/rwandaDistrictsSectors'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Validation schema for student registration
const studentRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name is required'),
  gender: z.enum(['M', 'F'], { required_error: 'Gender is required' }),
  age: z.number().min(3, 'Age must be at least 3').max(25, 'Age cannot exceed 25'),
  dob: z.string().min(1, 'Date of birth is required'),
  
  // Address information - only district and sector
  address: z.object({
    district: z.string().min(1, 'District is required'),
    sector: z.string().min(1, 'Sector is required')
  }),
  
  // Socio-economic information - only essential fields
  socioEconomic: z.object({
    ubudeheLevel: z.number().min(1).max(4),
    hasParents: z.union([
      z.boolean(),
      z.string()
    ]).transform((val) => {
      if (typeof val === 'string') return val === 'true';
      return Boolean(val);
    }),
    familyStability: z.union([
      z.boolean(),
      z.string()
    ]).transform((val) => {
      if (typeof val === 'string') return val === 'true';
      return Boolean(val);
    }),
    numberOfSiblings: z.number().min(0).max(20),
    distanceToSchoolKm: z.number().min(0).max(50, 'Distance cannot exceed 50 km').optional()
  }),
  
  // Guardian contacts - updated with new requirements (max 2)
  guardianContacts: z.array(z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    relation: z.enum(['Father', 'Mother', 'Uncle', 'Aunt', 'Sibling', 'Other Relative']),
    email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
    phone: z.string().min(10, 'Phone number is required'),
    education: z.enum(['None', 'Primary', 'Secondary', 'University'], { required_error: 'Education level is required' }),
    occupation: z.string().min(2, 'Occupation is required'),
    isPrimary: z.boolean().default(false)
  })).min(1, 'At least one parent/guardian is required').max(2, 'Maximum 2 parents/guardians allowed')
})

type StudentRegistrationForm = z.infer<typeof studentRegistrationSchema>

// Rwanda districts for dropdown - using dynamic data

export function StudentRegistrationPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [districts, setDistricts] = useState(getDistricts())
  const [sectors, setSectors] = useState<string[]>([])
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)

  // Fetch teacher's assigned classes
  const { data: teacherClassesData, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => apiClient.getTeacherMyClasses(),
    enabled: user?.role === 'TEACHER',
  })

  const teacherClasses = teacherClassesData?.data || []

  // Mutation for creating student
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => apiClient.createStudent(studentData),
    onSuccess: async (response) => {
      // Upload profile picture if provided
      if (profilePicture && response?.data?._id) {
        try {
          await apiClient.uploadStudentProfilePicture(response.data._id, profilePicture)
        } catch (error: any) {
          console.error('Failed to upload profile picture:', error)
          // Don't block success if picture upload fails
        }
      }
      
      // Invalidate all related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setSubmitSuccess(true)
      
      // Reset form and redirect after success
      setTimeout(() => {
        setSubmitSuccess(false)
        setProfilePicture(null)
        setProfilePicturePreview(null)
        window.location.href = '/students'
      }, 2000)
    },
    onError: (error: any) => {
      // Show detailed validation errors if available
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((err: any) => 
          `${err.param || err.path}: ${err.msg || err.message || 'Invalid value'}`
        ).join('\n')
        alert(`Validation failed:\n\n${errorMessages}`)
      } else if (error.message) {
        alert(error.message)
      } else {
        alert('Failed to register student. Please check all fields and try again.')
      }
    }
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger
  } = useForm<StudentRegistrationForm>({
    resolver: zodResolver(studentRegistrationSchema),
    mode: 'onChange', // Validate on change for better UX
    defaultValues: {
      socioEconomic: {
        ubudeheLevel: 4,
        hasParents: true,
        familyStability: true,
        numberOfSiblings: 0,
        distanceToSchoolKm: undefined
      },
      guardianContacts: [{
        firstName: '',
        lastName: '',
        relation: 'Father',
        email: '',
        phone: '',
        education: 'Primary',
        occupation: '',
        isPrimary: true
      }]
    }
  })

  // Watch form values to check if we can enable submit button
  const formValues = watch()
  
  // Helper function to check if at least one guardian has all required fields
  const hasValidGuardian = () => {
    if (!formValues.guardianContacts || formValues.guardianContacts.length === 0) {
      return false
    }
    
    // Check if at least one guardian has all required fields filled
    // Email is optional, so we don't require it
    return formValues.guardianContacts.some(guardian => 
      guardian?.firstName?.trim()?.length >= 2 &&
      guardian?.lastName?.trim()?.length >= 2 &&
      guardian?.relation &&
      guardian?.phone?.trim()?.length >= 10 &&
      guardian?.education &&
      guardian?.occupation?.trim()?.length >= 2
    )
  }

  // Check if all required fields are filled (excluding optional email for guardian)
  const canSubmit = () => {
    // Check if teacher has assigned classes
    if (!teacherClasses || teacherClasses.length === 0) {
      return false
    }

    // Check student personal info
    const hasPersonalInfo = (
      formValues.firstName?.trim()?.length >= 2 &&
      formValues.lastName?.trim()?.length >= 2 &&
      formValues.gender &&
      formValues.age >= 3 &&
      formValues.age <= 25 &&
      formValues.dob
    )

    // Check address
    const hasAddress = (
      formValues.address?.district &&
      formValues.address?.sector
    )

    // Check socio-economic info (hasParents and familyStability can be string 'true'/'false' or boolean)
    const hasSocioEconomic = (
      formValues.socioEconomic?.ubudeheLevel >= 1 &&
      formValues.socioEconomic?.ubudeheLevel <= 4 &&
      (formValues.socioEconomic?.hasParents === true || 
       formValues.socioEconomic?.hasParents === false ||
       formValues.socioEconomic?.hasParents === 'true' ||
       formValues.socioEconomic?.hasParents === 'false') &&
      (formValues.socioEconomic?.familyStability === true ||
       formValues.socioEconomic?.familyStability === false ||
       formValues.socioEconomic?.familyStability === 'true' ||
       formValues.socioEconomic?.familyStability === 'false') &&
      typeof formValues.socioEconomic?.numberOfSiblings === 'number' &&
      formValues.socioEconomic?.numberOfSiblings >= 0 &&
      formValues.socioEconomic?.numberOfSiblings <= 20
    )

    // Check at least one valid guardian
    const hasGuardian = hasValidGuardian()

    return hasPersonalInfo && hasAddress && hasSocioEconomic && hasGuardian
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'guardianContacts'
  })

  const selectedDistrict = watch('address.district')

  // Rwanda administrative structure integration - only districts and sectors
  useEffect(() => {
    if (selectedDistrict) {
      const districtSectors = getSectorsByDistrict(selectedDistrict)
      setSectors(districtSectors)
      // Clear sector when district changes
      setValue('address.sector', '')
    }
  }, [selectedDistrict, setValue])

  const onSubmit = async (data: StudentRegistrationForm) => {
    try {
      // Check if teacher has assigned classes
      if (!teacherClasses || teacherClasses.length === 0) {
        alert('Error: You do not have any assigned classes. Please contact your administrator to assign you to a class.')
        return
      }

      // Use the first assigned class (or allow selection in the future)
      const selectedClass = teacherClasses[0]
      
      // Calculate age from date of birth
      const dob = new Date(data.dob)
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--
      }
      
      const studentData = {
        firstName: data.firstName,
        middleName: data.middleName || '',
        lastName: data.lastName,
        gender: data.gender,
        age: age,
        dob: dob.toISOString(), // Send as ISO string for backend validation
        dateOfBirth: dob, // Also include as Date object
        classId: selectedClass._id,
        address: {
          district: data.address.district,
          sector: data.address.sector
          // cell and village can be added later in student detail page
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
        guardianContacts: data.guardianContacts.map(contact => ({
          firstName: contact.firstName.trim(),
          lastName: contact.lastName.trim(),
          name: `${contact.firstName.trim()} ${contact.lastName.trim()}`, // Full name for backward compatibility
          relation: contact.relation,
          email: contact.email && contact.email.trim() !== '' ? contact.email.trim() : undefined, // Set to undefined if empty
          phone: contact.phone.trim(), // Ensure phone is trimmed
          education: contact.education,
          educationLevel: contact.education, // For backward compatibility
          occupation: contact.occupation.trim(),
          job: contact.occupation.trim(), // For backward compatibility
          isPrimary: contact.isPrimary || false
        })),
        schoolId: user?.schoolId,
        assignedTeacher: user?._id
      }

      createStudentMutation.mutate(studentData)
    } catch (error: any) {
      console.error('Error creating student:', error)
      alert(error.message || 'Failed to register student. Please check all fields and try again.')
    }
  }

  const addGuardianContact = () => {
    if (fields.length < 2) {
      append({
        firstName: '',
        lastName: '',
        relation: 'Mother',
        email: '',
        phone: '',
        education: 'Primary',
        occupation: '',
        isPrimary: false
      })
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Student Registered Successfully!
              </h3>
              <p className="text-gray-600">
                The student has been added to the system and risk assessment will begin automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Register New Student</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Complete student information for dropout risk assessment in rural and peri-urban schools
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          {/* Class Information */}
          {classesLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Loading your assigned classes...</p>
              </CardContent>
            </Card>
          ) : teacherClasses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Assigned Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Class:</span> {teacherClasses[0].className || teacherClasses[0].name}
                    {teacherClasses[0].grade && ` (Grade ${teacherClasses[0].grade})`}
                    {teacherClasses[0].section && ` - Section ${teacherClasses[0].section}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    Students will be registered in this class automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You don't have any assigned classes. Please contact your administrator to assign you to a class before registering students.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Optional Profile Picture Upload */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
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
                          setProfilePicture(file)
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setProfilePicturePreview(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                    {profilePicture && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicture(null)
                          setProfilePicturePreview(null)
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    {...register('middleName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    placeholder="Enter middle name (optional)"
                  />
                  {errors.middleName && (
                    <p className="mt-1 text-sm text-red-600">{errors.middleName.message}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    {...register('dob')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
                    onChange={(e) => {
                      const dob = e.target.value;
                      if (dob) {
                        const today = new Date();
                        const birthDate = new Date(dob);
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                        setValue('age', calculatedAge);
                      }
                    }}
                  />
                  {errors.dob && (
                    <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age * <span className="text-xs text-gray-500">(Auto-calculated)</span>
                  </label>
                  <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    min="3"
                    max="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 h-10"
                    placeholder="Enter date of birth above"
                    readOnly
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <select
                    {...register('address.district')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select district</option>
                    {districts.map((district, index) => (
                      <option key={`${district}-${index}`} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors.address?.district && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.district.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sector *
                  </label>
                  <select
                    {...register('address.sector')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedDistrict}
                  >
                    <option value="">Select sector</option>
                    {sectors.map((sector, index) => (
                      <option key={`${sector}-${index}`} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  {errors.address?.sector && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.sector.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Socio-Economic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HomeIcon className="h-5 w-5 mr-2" />
                Socio-Economic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubudehe Level *
                  </label>
                  <select
                    {...register('socioEconomic.ubudeheLevel', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Level 1 (Most vulnerable)</option>
                    <option value={2}>Level 2 (Vulnerable)</option>
                    <option value={3}>Level 3 (Moderate)</option>
                    <option value={4}>Level 4 (Least vulnerable)</option>
                  </select>
                  {errors.socioEconomic?.ubudeheLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.ubudeheLevel.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Siblings *
                  </label>
                  <input
                    {...register('socioEconomic.numberOfSiblings', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter number of siblings"
                  />
                  {errors.socioEconomic?.numberOfSiblings && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.numberOfSiblings.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Has Both Parents *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.hasParents')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.hasParents')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                  {errors.socioEconomic?.hasParents && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.hasParents.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Stability *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Is the family/home environment stable?</p>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.familyStability')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes (Stable)
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.familyStability')}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance to School (km) *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Distance from student's home to school in kilometers</p>
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  />
                  {errors.socioEconomic?.distanceToSchoolKm && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.distanceToSchoolKm.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian/Parent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Parents/Guardians (Maximum 2)
                </div>
                {fields.length < 2 && (
                  <Button
                    type="button"
                    onClick={addGuardianContact}
                    className="flex items-center text-sm"
                    disabled={fields.length >= 2}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Parent/Guardian
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {field.relation || 'Parent/Guardian'} {index + 1}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.firstName`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                      {errors.guardianContacts?.[index]?.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.firstName?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.lastName`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                      {errors.guardianContacts?.[index]?.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.lastName?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relation *
                      </label>
                      <select
                        {...register(`guardianContacts.${index}.relation`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select relation</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other Relative">Other Relative</option>
                      </select>
                      {errors.guardianContacts?.[index]?.relation && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.relation?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-gray-500 text-xs">(Optional)</span>
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.email`)}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="guardian@example.com"
                      />
                      {errors.guardianContacts?.[index]?.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.email?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.phone`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+250 78 123 4567"
                      />
                      {errors.guardianContacts?.[index]?.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.phone?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Level *
                      </label>
                      <select
                        {...register(`guardianContacts.${index}.education`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select education level</option>
                        <option value="None">None</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="University">University</option>
                      </select>
                      {errors.guardianContacts?.[index]?.education && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.education?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Occupation *
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.occupation`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Farmer, Teacher, Business"
                      />
                      {errors.guardianContacts?.[index]?.occupation && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.occupation?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        {...register(`guardianContacts.${index}.isPrimary`)}
                        type="checkbox"
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Primary contact (for notifications)
                      </span>
                    </label>
                  </div>
                </div>
              ))}
              {fields.length >= 2 && (
                <p className="text-sm text-gray-600 italic">
                  Maximum of 2 parents/guardians allowed. Remove one to add another.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudentMutation.isPending || !canSubmit()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
            >
              {createStudentMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Registering Student...
                </>
              ) : (
                'Register Student'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
