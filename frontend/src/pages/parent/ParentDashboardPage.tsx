import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  UserIcon,
  ExclamationTriangleIcon, 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon,
  BellIcon,
  DocumentTextIcon,
  CalendarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import type { 
  Student,
  Attendance,
  Performance,
  Notification
} from '@/types'

// API client
const apiClient = {
  getParentChildren: async () => {
    const response = await fetch('/api/parent/children')
    return response.json()
  },
  getParentMessages: async () => {
    const response = await fetch('/api/parent/messages')
    return response.json()
  },
  getChildAttendance: async (childId: string) => {
    const response = await fetch(`/api/parent/children/${childId}/attendance`)
    return response.json()
  },
  getChildPerformance: async (childId: string) => {
    const response = await fetch(`/api/parent/children/${childId}/performance`)
    return response.json()
  }
}

export function ParentDashboardPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => apiClient.getParentChildren(),
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['parent-messages'],
    queryFn: () => apiClient.getParentMessages(),
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['child-attendance', selectedChild],
    queryFn: () => apiClient.getChildAttendance(selectedChild!),
    enabled: !!selectedChild,
  })

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['child-performance', selectedChild],
    queryFn: () => apiClient.getChildPerformance(selectedChild!),
    enabled: !!selectedChild,
  })

  const isLoading = childrenLoading || messagesLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Parent Dashboard</h1>
          <p className="text-neutral-600">Monitor your child's progress and stay informed</p>
        </div>
        <Link to="/report">
          <Button variant="primary">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </Link>
      </div>

      {/* Child Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {children?.data?.map((child: any) => (
          <Card key={child._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600">
                    {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-sm text-neutral-600">{child.classroomId}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Attendance Streak */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-neutral-600">Attendance Streak</span>
                  </div>
                  <Badge variant="success">{child.attendanceStreak} days</Badge>
                </div>

                {/* Last Term Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-neutral-600">Last Term Score</span>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">{child.lastTermScore}%</span>
                </div>

                {/* Current Alerts */}
                {child.alerts && child.alerts.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-neutral-600">Alerts</span>
                    </div>
                    <Badge variant="warning">{child.alerts.length}</Badge>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-200">
                  <Link to={`/report?child=${child._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      View Report
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Messages & Notices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-blue-600" />
            Messages & Notices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages?.data?.slice(0, 5).map((message: any) => (
              <div key={message._id} className="flex items-start space-x-3 p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BellIcon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-neutral-900">{message.title}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">{message.message}</p>
                  {message.childName && (
                    <p className="text-xs text-neutral-500 mt-1">Regarding: {message.childName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/notifications">
              <Button variant="outline" className="w-full">
                View All Messages
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/report">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <DocumentTextIcon className="h-6 w-6 mb-2" />
                View Report
              </Button>
            </Link>
            <Link to="/notifications">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <BellIcon className="h-6 w-6 mb-2" />
                Messages
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <UserIcon className="h-6 w-6 mb-2" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col" onClick={() => window.print()}>
              <DocumentTextIcon className="h-6 w-6 mb-2" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
