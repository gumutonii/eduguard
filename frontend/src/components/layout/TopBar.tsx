import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api'
import { MagnifyingGlassIcon, BellIcon, Bars3Icon } from '@heroicons/react/24/outline'

interface TopBarProps {
  onMobileMenuClick?: () => void
}

export function TopBar({ onMobileMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-neutral-700 lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={() => onMobileMenuClick?.()}
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
            className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
              <Button variant="ghost" onClick={logout} className="min-h-[44px]">
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
