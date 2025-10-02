import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/Button'
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline'

export function TopBar() {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-neutral-400 pl-3" />
          <input
            type="text"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-neutral-900 placeholder:text-neutral-400 focus:ring-0 sm:text-sm"
            placeholder="Search students, classes, or reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />
            <div className="flex items-center gap-x-4">
              <div className="hidden lg:block">
                <span className="text-sm font-medium text-neutral-700">{user?.name}</span>
                <span className="text-xs text-neutral-500 ml-2">{user?.role}</span>
              </div>
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
