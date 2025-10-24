import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { SimpleFooter } from '@/components/layout/SimpleFooter'
import { useAuthStore } from '@/stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import DistrictSectorSelect from '@/components/ui/DistrictSectorSelect'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'TEACHER'], {
    required_error: 'Please select a role',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  // School details for ADMIN
  schoolName: z.string().optional(),
  schoolDistrict: z.string().optional(),
  schoolSector: z.string().optional(),
  schoolPhone: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal('')),
  adminTitle: z.string().optional(),
  // Class selection for TEACHER
  selectedSchool: z.string().optional(),
  selectedClass: z.string().optional(),
  teacherTitle: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => {
  if (data.role === 'ADMIN') {
    return data.schoolName && data.schoolDistrict && data.schoolSector;
  }
  return true;
}, {
  message: 'School details are required for Admin role',
  path: ['schoolName']
}).refine((data) => {
  if (data.role === 'TEACHER') {
    return data.selectedSchool && data.selectedClass;
  }
  return true;
}, {
  message: 'School and class selection are required for Teacher role',
  path: ['selectedSchool']
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  // Fetch schools for teacher registration
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools-for-registration'],
    queryFn: () => apiClient.getSchoolsForRegistration(),
  })

  const schools = schoolsData?.data || []
  const selectedSchool = watch('selectedSchool')

  // Fetch classes for selected school
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-for-school', selectedSchool],
    queryFn: () => apiClient.getClassesForSchool(selectedSchool!),
    enabled: !!selectedSchool, // Only fetch when a school is selected
  })

  const classes = classesData?.data || []

  // Clear selected class when school changes
  useEffect(() => {
    if (selectedSchool) {
      setValue('selectedClass', '')
    }
  }, [selectedSchool, setValue])

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError()
      const { acceptTerms, ...registrationData } = data
      const response = await apiClient.register(registrationData)
      
      // Always show approval message for new registrations
      alert('Registration successful! Your account is pending approval. You will receive an email notification once an administrator approves your account.')
      navigate('/auth/login')
    } catch (error) {
      // Error is handled by the auth store
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <AuthHeader />
      <div className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <svg 
                className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-neutral-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Join EduGuard to help prevent student dropout
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                  Full name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="mt-1 input"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="mt-1 input"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-neutral-700">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="mt-1 input"
                >
                  <option value="">Select your role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Phone number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                  Phone Number (Optional)
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="mt-1 input"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Admin School Details */}
              {watch('role') === 'ADMIN' && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">School Information</h3>
                    
                    <div>
                      <label htmlFor="schoolName" className="block text-sm font-medium text-neutral-700">
                        School Name *
                      </label>
                      <input
                        {...register('schoolName')}
                        type="text"
                        className="mt-1 input"
                        placeholder="Enter school name"
                      />
                      {errors.schoolName && (
                        <p className="mt-1 text-sm text-red-600">{errors.schoolName.message}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <DistrictSectorSelect
                        selectedDistrict={watch('schoolDistrict') || ''}
                        selectedSector={watch('schoolSector') || ''}
                        onDistrictChange={(district) => setValue('schoolDistrict', district)}
                        onSectorChange={(sector) => setValue('schoolSector', sector)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      />
                      {errors.schoolDistrict && (
                        <p className="mt-1 text-sm text-red-600">{errors.schoolDistrict.message}</p>
                      )}
                      {errors.schoolSector && (
                        <p className="mt-1 text-sm text-red-600">{errors.schoolSector.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="schoolPhone" className="block text-sm font-medium text-neutral-700">
                          School Phone
                        </label>
                        <input
                          {...register('schoolPhone')}
                          type="tel"
                          className="mt-1 input"
                          placeholder="Enter school phone"
                        />
                        {errors.schoolPhone && (
                          <p className="mt-1 text-sm text-red-600">{errors.schoolPhone.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="schoolEmail" className="block text-sm font-medium text-neutral-700">
                          School Email
                        </label>
                        <input
                          {...register('schoolEmail')}
                          type="email"
                          className="mt-1 input"
                          placeholder="Enter school email"
                        />
                        {errors.schoolEmail && (
                          <p className="mt-1 text-sm text-red-600">{errors.schoolEmail.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="adminTitle" className="block text-sm font-medium text-neutral-700">
                        Your Title/Position
                      </label>
                      <input
                        {...register('adminTitle')}
                        type="text"
                        className="mt-1 input"
                        placeholder="e.g., Head Teacher, Director of Studies"
                      />
                      {errors.adminTitle && (
                        <p className="mt-1 text-sm text-red-600">{errors.adminTitle.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Teacher School and Class Selection */}
              {watch('role') === 'TEACHER' && (
                <>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-neutral-900 mb-4">School & Class Selection</h3>
                    
                    <div>
                      <label htmlFor="selectedSchool" className="block text-sm font-medium text-neutral-700">
                        Select School *
                      </label>
                      <select
                        {...register('selectedSchool')}
                        className="mt-1 input"
                        disabled={schoolsLoading}
                      >
                        <option value="">
                          {schoolsLoading ? 'Loading schools...' : 'Select a school'}
                        </option>
                        {schools.map((school) => (
                          <option key={school._id} value={school.name}>
                            {school.name} ({school.district}, {school.sector})
                          </option>
                        ))}
                      </select>
                      {errors.selectedSchool && (
                        <p className="mt-1 text-sm text-red-600">{errors.selectedSchool.message}</p>
                      )}
                      {schools.length === 0 && !schoolsLoading && (
                        <p className="mt-1 text-sm text-amber-600">
                          No schools available. Please contact an administrator to add schools first.
                        </p>
                      )}
                      {schools.length > 0 && !schoolsLoading && (
                        <p className="mt-1 text-sm text-green-600">
                          {schools.length} school{schools.length !== 1 ? 's' : ''} available for selection
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="selectedClass" className="block text-sm font-medium text-neutral-700">
                        Select Class *
                      </label>
                      <select
                        {...register('selectedClass')}
                        className="mt-1 input"
                        disabled={!selectedSchool || classesLoading}
                      >
                        <option value="">
                          {!selectedSchool 
                            ? 'Select a school first' 
                            : classesLoading 
                              ? 'Loading classes...' 
                              : 'Select a class'
                          }
                        </option>
                        {classes.map((classItem) => (
                          <option key={classItem._id} value={classItem.className}>
                            {classItem.className}
                          </option>
                        ))}
                      </select>
                      {errors.selectedClass && (
                        <p className="mt-1 text-sm text-red-600">{errors.selectedClass.message}</p>
                      )}
                      {selectedSchool && classes.length === 0 && !classesLoading && (
                        <p className="mt-1 text-sm text-amber-600">
                          No classes available for this school. Please contact the school administrator.
                        </p>
                      )}
                      {selectedSchool && classes.length > 0 && !classesLoading && (
                        <p className="mt-1 text-sm text-green-600">
                          {classes.length} class{classes.length !== 1 ? 'es' : ''} available for selection
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="teacherTitle" className="block text-sm font-medium text-neutral-700">
                        Your Teaching Subject/Title
                      </label>
                      <input
                        {...register('teacherTitle')}
                        type="text"
                        className="mt-1 input"
                        placeholder="e.g., Mathematics Teacher, Physics Teacher"
                      />
                      {errors.teacherTitle && (
                        <p className="mt-1 text-sm text-red-600">{errors.teacherTitle.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="input pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-neutral-600">
                    I agree to the{' '}
                    <Link to="/terms-conditions" className="text-indigo-600 hover:text-indigo-500">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-indigo-600 hover:text-indigo-500">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-neutral-500">Already have an account?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/auth/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign in to your account
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SimpleFooter />
    </div>
  )
}