import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { 
  BellIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import type { NotificationHistory } from '@/types'

export function TeacherNotificationsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    channel: '',
    page: 1,
  })

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ['messages', filters],
    queryFn: () => apiClient.getMessages(filters),
  })

  // Transform messages to match NotificationHistory interface
  const notifications = (messagesResponse?.data || []).map((message: any) => {
    // Extract studentId - handle both populated object and string ID
    let studentId = '';
    if (message.studentId) {
      if (typeof message.studentId === 'object') {
        // Populated student object - use _id or studentId field
        studentId = message.studentId._id || message.studentId.studentId || '';
      } else {
        // String ID
        studentId = message.studentId;
      }
    }
    
    return {
      _id: message._id,
      studentId: studentId,
      recipient: message.recipientName || '',
      channel: message.channel === 'BOTH' ? 'EMAIL' : (message.channel || 'EMAIL'), // Map BOTH to EMAIL for display
      template: message.template || message.type || '',
      status: message.status || 'PENDING',
      sentAt: message.sentAt || message.createdAt || new Date().toISOString(),
      deliveredAt: message.deliveredAt,
    };
  }) as NotificationHistory[]

  const pagination = messagesResponse?.pagination

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'info'
      case 'DELIVERED':
        return 'success'
      case 'FAILED':
        return 'error'
      case 'PENDING':
        return 'warning'
      default:
        return 'info'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <EnvelopeIcon className="h-4 w-4" />
      case 'SMS':
        return <DevicePhoneMobileIcon className="h-4 w-4" />
      case 'PUSH':
        return <BellIcon className="h-4 w-4" />
      default:
        return <EnvelopeIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-600">View notification history and communication logs</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="pl-10 input"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Channel
              </label>
              <select
                className="input"
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              >
                <option value="">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', status: '', channel: '', page: 1 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Notification History ({pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-neutral-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No notifications</h3>
              <p className="mt-1 text-sm text-neutral-500">
                No notifications have been sent yet. When notifications are sent, they will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {notifications.map((notification: NotificationHistory) => (
                      <tr key={notification._id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {notification.sentAt 
                            ? new Date(notification.sentAt).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {notification.recipient || 'N/A'}
                          </div>
                          {notification.studentId && (
                          <div className="text-sm text-neutral-500">
                              Student ID: {typeof notification.studentId === 'string' 
                                ? notification.studentId.slice(-8) 
                                : String(notification.studentId).slice(-8)}
                          </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {getChannelIcon(notification.channel)}
                            </span>
                            <span className="text-sm text-neutral-900">
                              {notification.channel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {notification.template}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(notification.status)}>
                            {notification.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {notification.studentId && (
                          <Link to={`/students/${notification.studentId}`}>
                            <Button variant="outline" size="sm">
                              View Student
                            </Button>
                          </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-neutral-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-neutral-700">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
