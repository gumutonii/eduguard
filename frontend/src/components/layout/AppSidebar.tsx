import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
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
} from '@heroicons/react/24/outline'

// Role-based navigation
const getNavigation = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Students', href: '/students', icon: UserGroupIcon },
        { name: 'Teachers', href: '/teachers', icon: UserGroupIcon },
        { name: 'Approvals', href: '/approvals', icon: UserPlusIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
    case 'TEACHER':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Students', href: '/students', icon: UserGroupIcon },
        { name: 'Notifications', href: '/notifications', icon: BellIcon },
        { name: 'Profile', href: '/profile', icon: Cog6ToothIcon },
      ]
    case 'PARENT':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Report', href: '/report', icon: DocumentTextIcon },
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

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-primary-600">EduGuard</h1>
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
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-medium text-neutral-700">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <span className="sr-only">Your profile</span>
                <span aria-hidden="true">{user?.name}</span>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
