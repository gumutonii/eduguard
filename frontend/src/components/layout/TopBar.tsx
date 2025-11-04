import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api'
import { MagnifyingGlassIcon, BellIcon, Bars3Icon } from '@heroicons/react/24/outline'

export function TopBar() {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch user profile to get profile picture
  // Use user ID in query key to ensure cache isolation per user
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?._id],
    queryFn: () => apiClient.getProfile(),
    enabled: !!user?._id, // Only fetch if user is authenticated
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  })

  const profilePicture = userProfile?.data?.profilePicture
  const userName = userProfile?.data?.name || user?.name || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-neutral-700 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1 items-center min-w-0">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-4 sm:w-5 text-neutral-400 pl-2 sm:pl-3" />
            <input
              type="text"
              className="block h-full w-full border-0 py-0 pl-8 sm:pl-10 pr-2 text-neutral-900 placeholder:text-neutral-400 focus:ring-0 text-xs sm:text-sm"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
          <Link
            to="/notifications"
            className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </Link>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />
            <div className="flex items-center gap-x-3">
              {/* Profile Picture Avatar */}
              <Link to="/profile" className="hidden lg:flex items-center gap-x-3 hover:opacity-80 transition-opacity">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                    <span className="text-xs font-semibold text-primary-600">
                      {userInitials}
                    </span>
                  </div>
                )}
              <div className="hidden lg:block">
                  <span className="text-sm font-medium text-neutral-700">{userName}</span>
              </div>
              </Link>
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile menu overlay */}
    {mobileMenuOpen && (
      <div className="lg:hidden" role="dialog" aria-modal="true">
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-4 py-6 sm:max-w-sm sm:ring-1 sm:ring-neutral-900/10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-600">EduGuard</h1>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-neutral-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-neutral-500/10">
              <div className="space-y-2 py-6">
                <a href="/dashboard" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                  Dashboard
                </a>
                {user?.role === 'TEACHER' && (
                  <>
                    <a href="/students" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                      Students
                    </a>
                    <a href="/students/register" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                      Register Student
                    </a>
                  </>
                )}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <>
                    <a href="/teachers" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                      Teachers
                    </a>
                    <a href="/classes" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                      Classes
                    </a>
                    {user?.role === 'SUPER_ADMIN' && (
                      <a href="/approvals" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                        Approvals
                      </a>
                    )}
                  </>
                )}
                <a href="/notifications" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                  Notifications
                </a>
                <a href="/profile" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-neutral-900 hover:bg-neutral-50">
                  Profile
                </a>
              </div>
              <div className="py-6">
                <Link to="/profile" className="flex items-center gap-x-4 hover:opacity-80 transition-opacity">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={userName}
                      className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                      <span className="text-sm font-semibold text-primary-600">
                        {userInitials}
                    </span>
                  </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-neutral-700">{userName}</div>
                    <div className="text-xs text-neutral-500">
                      {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                       user?.role === 'ADMIN' ? 'Admin' : 
                       user?.role === 'TEACHER' ? 'Teacher' : user?.role}
                    </div>
                  </div>
                </Link>
                <div className="mt-4">
                  <Button variant="ghost" onClick={logout} className="w-full justify-start">
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
