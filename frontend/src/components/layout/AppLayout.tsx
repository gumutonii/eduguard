import { ReactNode, useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="lg:pl-64">
        <TopBar onMobileMenuClick={() => setMobileMenuOpen(true)} />
        <main className="py-4 sm:py-6">
          <div className="mx-auto max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
