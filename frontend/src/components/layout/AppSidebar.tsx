import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserPlusIcon,
  BeakerIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

// Role-based navigation
const getNavigation = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        { name: 'System Overview', href: '/dashboard', icon: HomeIcon },
        { name: 'Schools', href: '/schools', icon: ChartBarIcon },
        { name: 'Users', href: '/users', icon: UserGroupIcon },
        { name: 'Students', href: '/students', icon: AcademicCapIcon },
        { name: 'Approvals', href: '/approvals', icon: UserPlusIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
    case 'ADMIN':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Teachers', href: '/teachers', icon: UserGroupIcon },
        { name: 'Classes', href: '/classes', icon: AcademicCapIcon },
        { name: 'Approvals', href: '/approvals', icon: UserPlusIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
    case 'TEACHER':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Students', href: '/students', icon: UserGroupIcon },
        { name: 'Attendance & Performance', href: '/attendance-performance', icon: ClipboardDocumentCheckIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
    default:
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Students', href: '/students', icon: UserGroupIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
  }
}

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuthStore()
  
  const navigation = getNavigation(user?.role || 'ADMIN')

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
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary-600">EduGuard</h1>
            <span className="text-xs text-neutral-500 font-medium">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
               user?.role === 'ADMIN' ? 'Admin' : 
               user?.role === 'TEACHER' ? 'Teacher' : user?.role}
            </span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50',
                          'group flex gap-x-3 rounded-xl p-2 text-sm font-medium leading-6'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-primary-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <Link
                to="/profile"
                className="flex items-center gap-x-4 px-2 py-3 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-xl transition-colors"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={userName}
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                    <span className="text-sm font-semibold text-primary-600">
                      {userInitials}
                    </span>
                  </div>
                )}
                <span className="sr-only">Your profile</span>
                <span aria-hidden="true" className="truncate">{userName}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
