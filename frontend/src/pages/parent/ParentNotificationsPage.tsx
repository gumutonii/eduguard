import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

// API client
const apiClient = {
  getParentMessages: async () => {
    const response = await fetch('/api/parent/messages')
    return response.json()
  }
}

export function ParentNotificationsPage() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['parent-messages'],
    queryFn: () => apiClient.getParentMessages(),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages & Notifications</h1>
          <p className="text-neutral-600">View messages and notifications from the school</p>
        </div>
        <Link to="/report">
          <Button variant="primary">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            View Report
          </Button>
        </Link>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Messages ({messages?.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages?.data?.map((message: any) => (
              <div key={message._id} className="border border-neutral-200 rounded-xl p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BellIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900">{message.title}</h3>
                        <p className="text-sm text-neutral-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-neutral-700 mb-3">{message.message}</p>
                    {message.childName && (
                      <p className="text-sm text-neutral-500">
                        Regarding: {message.childName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={message.type === 'URGENT' ? 'error' : message.type === 'WARNING' ? 'warning' : 'info'}>
                      {message.type}
                    </Badge>
                    {message.childId && (
                      <Link to={`/report?child=${message.childId}`}>
                        <Button variant="outline" size="sm">
                          View Report
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {messages?.data?.length === 0 && (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No messages yet</h3>
              <p className="text-neutral-600">You'll receive notifications here when the school sends messages.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
