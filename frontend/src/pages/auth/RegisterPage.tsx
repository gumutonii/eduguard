import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SchoolSelect } from '@/components/ui/SchoolSelect'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { SimpleFooter } from '@/components/layout/SimpleFooter'
import { useAuthStore } from '@/stores/auth'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { RwandanSchool, SchoolService } from '@/lib/schools'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'TEACHER'], {
    required_error: 'Please select a role',
  }),
  schoolId: z.string().min(1, 'Please select a school'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<RwandanSchool | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const watchedSchoolId = watch('schoolId')

  const handleSchoolSelect = (schoolId: string, school: RwandanSchool) => {
    setSelectedSchool(school)
    setValue('schoolId', schoolId, { shouldValidate: true, shouldDirty: true })
    // Trigger validation for the schoolId field specifically
    trigger('schoolId')
  }

  const handleSchoolClear = () => {
    setSelectedSchool(null)
    setValue('schoolId', '', { shouldValidate: true, shouldDirty: true })
    trigger('schoolId')
  }

  // Update selected school when form value changes
  React.useEffect(() => {
    const findAndSetSchool = async () => {
      if (watchedSchoolId && !selectedSchool) {
        // Find school by ID and set it
        const school = SchoolService.getSchoolById(watchedSchoolId)
        if (school) {
          setSelectedSchool(school)
        }
      }
    }
    findAndSetSchool()
  }, [watchedSchoolId, selectedSchool])

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
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-neutral-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Join EduGuard to start preventing student dropouts
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
                  Full Name
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
                  <option value="ADMIN">Administrator</option>
                  <option value="TEACHER">Teacher</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="schoolId" className="block text-sm font-medium text-neutral-700">
                  School
                </label>
                <input
                  {...register('schoolId')}
                  type="hidden"
                />
                <SchoolSelect
                  value={watchedSchoolId || ''}
                  onChange={handleSchoolSelect}
                  onClear={handleSchoolClear}
                  placeholder="Search and select your school..."
                  error={errors.schoolId?.message}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="mt-1 input pr-10"
                    placeholder="Create a password (min 8 characters)"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="mt-1 input pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-neutral-700">
                    I agree to the{' '}
                    <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-500 underline">
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms-conditions" className="text-primary-600 hover:text-primary-500 underline">
                      Terms & Conditions
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
              <p className="text-center text-sm text-neutral-600">
                Already have an account?{' '}
                <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      <SimpleFooter />
    </div>
  )
}
