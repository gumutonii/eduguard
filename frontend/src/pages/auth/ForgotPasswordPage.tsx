import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { SimpleFooter } from '@/components/layout/SimpleFooter'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.forgotPassword(data.email)
      if (response.success) {
        setUserEmail(data.email)
        setIsSubmitted(true)
        // In development, show PIN if provided
        if (response.pin) {
          console.log('Development PIN:', response.pin)
        }
      } else {
        setError(response.message || 'Failed to send reset PIN')
      }
    } catch (error: any) {
      console.error('Password reset failed:', error)
      setError(error.message || 'Failed to send reset PIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <AuthHeader />
        <div className="flex-1 flex items-center justify-center py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="flex justify-center">
                <ShieldCheckIcon className="h-12 w-12 text-accent-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-neutral-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                We've sent a 5-digit PIN to <strong>{userEmail}</strong>
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                The PIN will expire in 15 minutes
              </p>
            </div>

            <Card>
              <CardContent className="text-center py-8">
                <p className="text-neutral-600 mb-6">
                  Enter the PIN you received in your email to reset your password.
                </p>
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    className="w-full min-h-[44px]"
                    onClick={() => navigate('/auth/reset-password', { state: { email: userEmail } })}
                  >
                    Enter PIN & Reset Password
                  </Button>
                  <Link to="/auth/login">
                    <Button variant="outline" className="w-full min-h-[44px]">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <SimpleFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <AuthHeader />
      <div className="flex-1 flex items-center justify-center py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-neutral-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enter your email address and we'll send you a 5-digit PIN to reset your password
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                    Email address
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="mt-1 input min-h-[44px] text-sm sm:text-base"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full min-h-[44px]"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Send Reset PIN
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-center text-sm text-neutral-600">
                  Remember your password?{' '}
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
