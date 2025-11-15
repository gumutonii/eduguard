import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { SimpleFooter } from '@/components/layout/SimpleFooter'
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

const resetPasswordSchema = z.object({
  pin: z.string().regex(/^\d{5}$/, 'PIN must be exactly 5 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    // Get email from location state or prompt user
    const stateEmail = location.state?.email
    if (stateEmail) {
      setEmail(stateEmail)
    } else {
      // If no email in state, redirect to forgot password
      navigate('/auth/forgot-password')
    }
  }, [location, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!email) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.resetPassword(email, data.pin, data.password)
      if (response.success) {
        setIsSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login')
        }, 3000)
      } else {
        setError(response.message || 'Failed to reset password')
      }
    } catch (error: any) {
      console.error('Password reset failed:', error)
      setError(error.message || 'Failed to reset password. Please check your PIN and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
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
                Password Reset Successful!
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>

            <Card>
              <CardContent className="text-center py-8">
                <Link to="/auth/login">
                  <Button variant="primary" className="w-full min-h-[44px]">
                    Go to Sign In
                  </Button>
                </Link>
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
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enter the 5-digit PIN sent to <strong>{email}</strong> and your new password
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-neutral-700">
                    5-Digit PIN
                  </label>
                  <input
                    {...register('pin')}
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    className="mt-1 input min-h-[44px] text-sm sm:text-base text-center text-2xl tracking-widest font-mono"
                    placeholder="00000"
                    style={{ letterSpacing: '0.5em' }}
                  />
                  {errors.pin && (
                    <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="mt-1 input pr-10 min-h-[44px] text-sm sm:text-base"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="mt-1 input pr-10 min-h-[44px] text-sm sm:text-base"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full min-h-[44px]"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Reset Password
                </Button>
              </form>

              <div className="mt-6">
                <p className="text-center text-sm text-neutral-600">
                  Didn't receive the PIN?{' '}
                  <Link to="/auth/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    Request a new one
                  </Link>
                </p>
                <p className="text-center text-sm text-neutral-600 mt-2">
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

