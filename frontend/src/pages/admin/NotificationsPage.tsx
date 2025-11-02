import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { 
  BellIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

interface InAppNotification {
  _id: string
  entityType: 'SCHOOL' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'CLASS'
  entityId: {
    _id: string
    name?: string
    firstName?: string
    lastName?: string
    className?: string
  }
  title: string
  message: string
  type: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isRead: boolean
  readAt?: string
  actionUrl?: string
  actionText?: string
  createdAt: string
}

export function AdminNotificationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    search: '',
    entityType: '',
    type: '',
    isRead: '',
    page: 1,
    limit: 20,
  })

  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['in-app-notifications', filters],
    queryFn: () => apiClient.getInAppNotifications(filters),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] })
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications'] })
    }
  })

  const notifications: InAppNotification[] = notificationsResponse?.data || []
  const pagination = notificationsResponse?.pagination
  const unreadCount = notifications.filter(n => !n.isRead).length

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage })
  }

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'error'
      case 'HIGH':
        return 'error'
      case 'MEDIUM':
        return 'warning'
      case 'LOW':
        return 'info'
      default:
        return 'info'
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'SCHOOL':
        return <BuildingOfficeIcon className="h-5 w-5" />
      case 'TEACHER':
        return <UserGroupIcon className="h-5 w-5" />
      case 'STUDENT':
        return <UserIcon className="h-5 w-5" />
      case 'PARENT':
        return <UserIcon className="h-5 w-5" />
      case 'CLASS':
        return <AcademicCapIcon className="h-5 w-5" />
      default:
        return <BellIcon className="h-5 w-5" />
    }
  }

  const getEntityName = (notification: InAppNotification) => {
    const entity = notification.entityId
    if (!entity) return 'Unknown'
    
    if (notification.entityType === 'STUDENT') {
      return `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || 'Student'
    }
    if (notification.entityType === 'CLASS') {
      return entity.className || entity.name || 'Class'
    }
    return entity.name || 'Unknown'
  }

  const getActionUrl = (notification: InAppNotification) => {
    if (notification.actionUrl) return notification.actionUrl
    
    // Default action URLs based on entity type
    switch (notification.entityType) {
      case 'STUDENT':
        return `/classes/${notification.entityId?._id}`
      case 'TEACHER':
        return `/teachers/${notification.entityId?._id}`
      case 'CLASS':
        return `/classes/${notification.entityId?._id}`
      case 'SCHOOL':
        return '/dashboard'
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">In-App Notifications</h1>
          <p className="text-neutral-600">View notifications for school, teachers, students, parents, and classes</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Entity Type
              </label>
              <select
                className="input"
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                <option value="SCHOOL">School</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="CLASS">Class</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notification Type
              </label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                <option value="STUDENT_REGISTERED">Student Registered</option>
                <option value="STUDENT_AT_RISK">Student At Risk</option>
                <option value="TEACHER_APPROVED">Teacher Approved</option>
                <option value="CLASS_CREATED">Class Created</option>
                <option value="ATTENDANCE_ALERT">Attendance Alert</option>
                <option value="PERFORMANCE_ALERT">Performance Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                className="input"
                value={filters.isRead}
                onChange={(e) => setFilters({ ...filters, isRead: e.target.value, page: 1 })}
              >
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ search: '', entityType: '', type: '', isRead: '', page: 1, limit: 20 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              Notifications ({pagination?.total || 0})
              {unreadCount > 0 && (
                <Badge variant="error" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-neutral-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-2 text-sm font-medium text-neutral-900">No notifications</h3>
              <p className="mt-1 text-sm text-neutral-500">
                No notifications found. Notifications about school, teachers, students, parents, and classes will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {notifications.map((notification: InAppNotification) => {
                  const actionUrl = getActionUrl(notification)
                  return (
                    <div
                      key={notification._id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.isRead
                          ? 'bg-white border-neutral-200'
                          : 'bg-primary-50 border-primary-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`mt-1 ${notification.isRead ? 'text-neutral-400' : 'text-primary-600'}`}>
                            {getEntityTypeIcon(notification.entityType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-sm font-medium ${notification.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}>
                                {notification.title}
                              </h3>
                              <Badge variant={getPriorityBadgeVariant(notification.priority)} className="text-xs">
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.entityType}
                              </Badge>
                              {!notification.isRead && (
                                <span className="h-2 w-2 bg-primary-600 rounded-full"></span>
                              )}
                            </div>
                            <p className={`mt-1 text-sm ${notification.isRead ? 'text-neutral-500' : 'text-neutral-700'}`}>
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-neutral-500">
                              <span>{getEntityName(notification)}</span>
                              <span>•</span>
                              <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                            </div>
                            {actionUrl && notification.actionText && (
                              <div className="mt-2">
                                <Link to={actionUrl}>
                                  <Button variant="outline" size="sm">
                                    {notification.actionText}
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={markAsReadMutation.isPending}
                            className="ml-2"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
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
