import { ReactNode } from 'react'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="py-4 sm:py-6">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
