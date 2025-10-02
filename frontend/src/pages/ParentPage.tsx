import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  UserIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  BellIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

export function ParentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Parent Portal</h1>
          <p className="text-neutral-600">Monitor your child's progress and school activities</p>
        </div>
      </div>

      {/* Child Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Child Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600">JP</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Jean Paul Nkurunziza</p>
                  <p className="text-sm text-neutral-600">P5A • Male</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Date of Birth</p>
                <p className="text-neutral-900">January 15, 2010</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600">Current Grade</p>
                <p className="text-neutral-900">P5A</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent-600">95%</p>
              <p className="text-sm text-neutral-600">This Month</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Present</span>
                <span>19 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Absent</span>
                <span>1 day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">78%</p>
              <p className="text-sm text-neutral-600">Average Score</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mathematics</span>
                <span>82%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>English</span>
                <span>75%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { message: 'Attendance below 90% this week', type: 'warning', date: '2 days ago' },
              { message: 'Good performance in Mathematics', type: 'success', date: '1 week ago' },
              { message: 'Parent meeting scheduled for next week', type: 'info', date: '2 weeks ago' },
            ].map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-xl">
                <Badge variant={alert.type as 'success' | 'warning' | 'info'}>
                  {alert.type.toUpperCase()}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">{alert.message}</p>
                  <p className="text-xs text-neutral-500">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900">School Phone</p>
                <p className="text-sm text-neutral-600">+250 788 123 456</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900">School Email</p>
                <p className="text-sm text-neutral-600">info@school.edu</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
