import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { 
  ShieldCheckIcon, 
  ChartBarIcon, 
  BellIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-10">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <h1 className="ml-2 text-xl sm:text-2xl font-bold text-neutral-900">EduGuard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                <Button variant="ghost" size="sm" className="sm:hidden">Login</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Prevent School Dropouts
              <span className="block text-primary-600">Before They Happen</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl lg:text-2xl text-neutral-600 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-4">
              EduGuard is a proactive system that identifies at-risk students early, 
              tracks their progress, and triggers interventions to keep them in school.
            </p>
            <div className="mt-8 sm:mt-10 lg:mt-12 xl:mt-14 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link to="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8">
                  Start Protecting Students
                </Button>
              </Link>
              <Link to="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-neutral-50">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-10">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">Early Warning System</h2>
            <p className="mt-4 text-base sm:text-lg lg:text-xl text-neutral-600 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto">
              Track key indicators and get alerts before students drop out
            </p>
          </div>
          
          <div className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="text-center p-6 lg:p-8">
                <UserGroupIcon className="h-12 w-12 lg:h-14 lg:w-14 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Student Tracking</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  Monitor attendance, performance, and socio-economic factors for each student.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6 lg:p-8">
                <ChartBarIcon className="h-12 w-12 lg:h-14 lg:w-14 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Risk Analysis</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  Automated risk assessment with early warning flags and intervention triggers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center p-6 lg:p-8">
                <BellIcon className="h-12 w-12 lg:h-14 lg:w-14 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Smart Alerts</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  Get notified when students need attention and track intervention progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-10">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">How EduGuard Works</h2>
            <p className="mt-4 text-base sm:text-lg lg:text-xl text-neutral-600">
              A simple three-step process to prevent dropouts
            </p>
          </div>

          <div className="mt-8 sm:mt-12 lg:mt-16 xl:mt-20">
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl lg:text-3xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Track</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  Record daily attendance, academic performance, and socio-economic indicators.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl lg:text-3xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Analyze</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  AI-powered analysis identifies at-risk students and generates early warnings.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl lg:text-3xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="mt-4 text-lg lg:text-xl font-semibold text-neutral-900">Intervene</h3>
                <p className="mt-2 text-sm lg:text-base text-neutral-600">
                  Take targeted actions to support students and prevent dropouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-primary-600">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Ready to Start?</h2>
          <p className="mt-4 text-base sm:text-xl lg:text-2xl text-primary-100 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto">
            Join schools already using EduGuard to prevent student dropouts
          </p>
          <div className="mt-6 sm:mt-8 lg:mt-10">
            <Link to="/auth/register" className="inline-block">
              <Button size="lg" variant="secondary" className="min-h-[44px]">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900">
        <div className="max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <h1 className="ml-2 text-lg sm:text-xl font-bold text-white">EduGuard</h1>
            </div>
            <p className="text-sm sm:text-base text-neutral-400 text-center sm:text-right">
              © 2025 EduGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
