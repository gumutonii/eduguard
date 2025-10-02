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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-neutral-900">EduGuard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl lg:text-6xl">
              Prevent School Dropouts
              <span className="block text-primary-600">Before They Happen</span>
            </h1>
            <p className="mt-6 text-xl text-neutral-600 max-w-3xl mx-auto">
              EduGuard is a proactive system that identifies at-risk students early, 
              tracks their progress, and triggers interventions to keep them in school.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" variant="primary">
                  Start Protecting Students
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900">Early Warning System</h2>
            <p className="mt-4 text-lg text-neutral-600">
              Track key indicators and get alerts before students drop out
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="text-center">
                <UserGroupIcon className="h-12 w-12 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Student Tracking</h3>
                <p className="mt-2 text-neutral-600">
                  Monitor attendance, performance, and socio-economic factors for each student.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center">
                <ChartBarIcon className="h-12 w-12 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Risk Analysis</h3>
                <p className="mt-2 text-neutral-600">
                  Automated risk assessment with early warning flags and intervention triggers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center">
                <BellIcon className="h-12 w-12 text-primary-600 mx-auto" />
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Smart Alerts</h3>
                <p className="mt-2 text-neutral-600">
                  Get notified when students need attention and track intervention progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neutral-900">How EduGuard Works</h2>
            <p className="mt-4 text-lg text-neutral-600">
              A simple three-step process to prevent dropouts
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Track</h3>
                <p className="mt-2 text-neutral-600">
                  Record daily attendance, academic performance, and socio-economic indicators.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Analyze</h3>
                <p className="mt-2 text-neutral-600">
                  AI-powered analysis identifies at-risk students and generates early warnings.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mx-auto">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Intervene</h3>
                <p className="mt-2 text-neutral-600">
                  Take targeted actions to support students and prevent dropouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Start?</h2>
          <p className="mt-4 text-xl text-primary-100">
            Join schools already using EduGuard to prevent student dropouts
          </p>
          <div className="mt-8">
            <Link to="/auth/register">
              <Button size="lg" variant="secondary">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-white">EduGuard</h1>
            </div>
            <p className="text-neutral-400">
              © 2024 EduGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
