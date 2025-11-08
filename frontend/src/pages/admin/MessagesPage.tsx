import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

export function MessagesPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', page, statusFilter, typeFilter],
    queryFn: () => apiClient.getMessages({
      page,
      limit: 20,
      status: statusFilter || undefined,
      type: typeFilter || undefined
    })
  })

  const messages = messagesData?.data || []
  const pagination = messagesData?.pagination

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          {status}
        </Badge>
      case 'FAILED':
        return <Badge variant="error" className="flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" />
          {status}
        </Badge>
      case 'PENDING':
      case 'QUEUED':
        return <Badge variant="warning" className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {status}
        </Badge>
      default:
        return <Badge variant="info">{status}</Badge>
    }
  }

  const getChannelIcon = (channel: string) => {
    if (channel === 'EMAIL' || channel === 'BOTH') {
      return <EnvelopeIcon className="h-4 w-4" />
    }
    return <PhoneIcon className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
          <p className="text-neutral-600">View and manage all sent messages to parents</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="ABSENCE_ALERT">Absence Alert</option>
                <option value="PERFORMANCE_ALERT">Performance Alert</option>
                <option value="RISK_ALERT">Risk Alert</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div
                  key={message._id}
                  className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getChannelIcon(message.channel)}
                        <h3 className="font-medium text-neutral-900">
                          {message.recipientName}
                        </h3>
                        <span className="text-sm text-neutral-500">
                          ({message.recipientPhone || message.recipientEmail || 'No contact'})
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">
                        <strong>Student:</strong> {message.studentId?.firstName} {message.studentId?.lastName}
                      </p>
                      {message.subject && (
                        <p className="text-sm font-medium text-neutral-900 mb-1">
                          {message.subject}
                        </p>
                      )}
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        <span className="capitalize">
                          {message.type?.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="capitalize">
                          {message.language}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(message.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-neutral-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

