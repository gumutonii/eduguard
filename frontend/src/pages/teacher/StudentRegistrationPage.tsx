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

// Validation schema for student registration
const studentRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name is required'),
  gender: z.enum(['M', 'F'], { required_error: 'Gender is required' }),
  age: z.number().min(3, 'Age must be at least 3').max(25, 'Age cannot exceed 25'),
  dob: z.string().min(1, 'Date of birth is required'),
  classroomId: z.string().min(1, 'Class is required'),
  
  // Address information
  address: z.object({
    district: z.string().min(1, 'District is required'),
    sector: z.string().min(1, 'Sector is required'),
    cell: z.string().min(1, 'Cell is required'),
    village: z.string().min(1, 'Village is required')
  }),
  
  // Socio-economic information
  socioEconomic: z.object({
    ubudeheLevel: z.number().min(1).max(4),
    hasParents: z.boolean(),
    guardianType: z.string().optional(),
    parentJob: z.string().optional(),
    familyConflict: z.boolean(),
    numberOfSiblings: z.number().min(0).max(20),
    parentEducationLevel: z.enum(['None', 'Primary', 'Secondary', 'University', 'Other'])
  }),
  
  // Guardian contacts
  guardianContacts: z.array(z.object({
    name: z.string().min(2, 'Guardian name is required'),
    relation: z.enum(['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other']),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    job: z.string().optional(),
    educationLevel: z.enum(['None', 'Primary', 'Secondary', 'University', 'Other']).optional(),
    isPrimary: z.boolean().default(false)
  })).min(1, 'At least one guardian contact is required')
})

type StudentRegistrationForm = z.infer<typeof studentRegistrationSchema>

// Rwanda districts for dropdown
const rwandaDistricts = [
  'Kigali City', 'Gasabo', 'Kicukiro', 'Nyarugenge',
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
  'Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo',
  'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
  'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'
]

export function StudentRegistrationPage() {
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [districts, setDistricts] = useState(rwandaDistricts)
  const [sectors, setSectors] = useState<string[]>([])
  const [cells, setCells] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<StudentRegistrationForm>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      socioEconomic: {
        ubudeheLevel: 4,
        hasParents: true,
        familyConflict: false,
        numberOfSiblings: 0,
        parentEducationLevel: 'Primary'
      },
      guardianContacts: [{
        name: '',
        relation: 'Father',
        phone: '',
        email: '',
        job: '',
        educationLevel: 'Primary',
        isPrimary: true
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'guardianContacts'
  })

  const hasParents = watch('socioEconomic.hasParents')
  const selectedDistrict = watch('address.district')
  const selectedSector = watch('address.sector')
  const selectedCell = watch('address.cell')

  // Mock Irembo API integration for address details
  useEffect(() => {
    if (selectedDistrict) {
      // Mock sectors based on district
      const mockSectors = [
        'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5'
      ]
      setSectors(mockSectors)
    }
  }, [selectedDistrict])

  useEffect(() => {
    if (selectedSector) {
      // Mock cells based on sector
      const mockCells = [
        'Cell 1', 'Cell 2', 'Cell 3', 'Cell 4'
      ]
      setCells(mockCells)
    }
  }, [selectedSector])

  useEffect(() => {
    if (selectedCell) {
      // Mock villages based on cell
      const mockVillages = [
        'Village 1', 'Village 2', 'Village 3'
      ]
      setVillages(mockVillages)
    }
  }, [selectedCell])

  const onSubmit = async (data: StudentRegistrationForm) => {
    setIsSubmitting(true)
    try {
      // Calculate age from date of birth
      const dob = new Date(data.dob)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      
      const studentData = {
        ...data,
        age,
        schoolId: user?.schoolId,
        assignedTeacherId: user?._id
      }

      await apiClient.createStudent(studentData)
      setSubmitSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setSubmitSuccess(false)
        window.location.reload()
      }, 3000)
      
    } catch (error) {
      console.error('Error creating student:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addGuardianContact = () => {
    append({
      name: '',
      relation: 'Guardian',
      phone: '',
      email: '',
      job: '',
      educationLevel: 'Primary',
      isPrimary: false
    })
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
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    {...register('middleName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter middle name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    min="3"
                    max="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    {...register('dob')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.dob && (
                    <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <input
                  {...register('classroomId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., P1A, P2B, S1A, S2B"
                />
                {errors.classroomId && (
                  <p className="mt-1 text-sm text-red-600">{errors.classroomId.message}</p>
                )}
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
                    {districts.map((district) => (
                      <option key={district} value={district}>
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
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                  {errors.address?.sector && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.sector.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cell *
                  </label>
                  <select
                    {...register('address.cell')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedSector}
                  >
                    <option value="">Select cell</option>
                    {cells.map((cell) => (
                      <option key={cell} value={cell}>
                        {cell}
                      </option>
                    ))}
                  </select>
                  {errors.address?.cell && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.cell.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village *
                  </label>
                  <select
                    {...register('address.village')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedCell}
                  >
                    <option value="">Select village</option>
                    {villages.map((village) => (
                      <option key={village} value={village}>
                        {village}
                      </option>
                    ))}
                  </select>
                  {errors.address?.village && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.village.message}</p>
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
                    Has Parents *
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
              </div>

              {!hasParents && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guardian Type *
                  </label>
                  <select
                    {...register('socioEconomic.guardianType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select guardian type</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.socioEconomic?.guardianType && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.guardianType.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Job
                  </label>
                  <input
                    {...register('socioEconomic.parentJob')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Farmer, Teacher, Business"
                  />
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
                    Parent Education Level *
                  </label>
                  <select
                    {...register('socioEconomic.parentEducationLevel')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="University">University</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.socioEconomic?.parentEducationLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.parentEducationLevel.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Conflict *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.familyConflict')}
                        type="radio"
                        value="false"
                        className="mr-2"
                      />
                      No
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('socioEconomic.familyConflict')}
                        type="radio"
                        value="true"
                        className="mr-2"
                      />
                      Yes
                    </label>
                  </div>
                  {errors.socioEconomic?.familyConflict && (
                    <p className="mt-1 text-sm text-red-600">{errors.socioEconomic.familyConflict.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Guardian Contacts
                </div>
                <Button
                  type="button"
                  onClick={addGuardianContact}
                  className="flex items-center text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Guardian
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Guardian {index + 1}
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
                        Full Name *
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.name`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter guardian name"
                      />
                      {errors.guardianContacts?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.name?.message}</p>
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
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.guardianContacts?.[index]?.relation && (
                        <p className="mt-1 text-sm text-red-600">{errors.guardianContacts[index]?.relation?.message}</p>
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
                        Email (Optional)
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
                        Job/Occupation
                      </label>
                      <input
                        {...register(`guardianContacts.${index}.job`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Farmer, Teacher, Business"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Education Level
                      </label>
                      <select
                        {...register(`guardianContacts.${index}.educationLevel`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="None">None</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="University">University</option>
                        <option value="Other">Other</option>
                      </select>
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
              disabled={isSubmitting || !isValid}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Registering Student...' : 'Register Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
