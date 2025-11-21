import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface PendingUser {
  _id: string
  name: string
  email: string
  role: 'ADMIN' | 'TEACHER' | 'PARENT'
  phone?: string
  schoolId?: {
    _id: string
    name: string
    district: string
    sector: string
  } | string | null
  selectedClass?: string
  teacherTitle?: string
  createdAt: string
}

export function UserApprovalPage() {
  const queryClient = useQueryClient()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch pending users with real-time updates using React Query
  const { data: pendingUsersData, isLoading: loading, refetch } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await apiClient.getPendingApprovals()
      return response.success ? response.data : []
    },
    staleTime: 15000, // 15 seconds - pending approvals need frequent updates
    gcTime: 60000, // 1 minute - keep in cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when window regains focus for real-time updates
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
    refetchInterval: 30000, // Auto-refetch every 30 seconds for real-time updates
  })

  const pendingUsers = pendingUsersData || []

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.approveUser(userId),
    onSuccess: () => {
      // Invalidate and refetch pending approvals
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
      setActionLoading(null)
    },
    onError: (error) => {
      console.error('Failed to approve user:', error)
      setActionLoading(null)
    }
  })

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.rejectUser(userId),
    onSuccess: () => {
      // Invalidate and refetch pending approvals
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
      setActionLoading(null)
    },
    onError: (error) => {
      console.error('Failed to reject user:', error)
      setActionLoading(null)
    }
  })

  const handleApprove = async (userId: string) => {
    setActionLoading(userId)
    approveUserMutation.mutate(userId)
  }

  const handleReject = async (userId: string) => {
    setActionLoading(userId)
    rejectUserMutation.mutate(userId)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'TEACHER': return 'bg-blue-100 text-blue-800'
      case 'PARENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <UserIcon className="h-5 w-5" />
      case 'TEACHER': return <AcademicCapIcon className="h-5 w-5" />
      case 'PARENT': return <UserGroupIcon className="h-5 w-5" />
      default: return <UserIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Approvals</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Teacher Approvals</h1>
          <p className="text-neutral-600">Review and approve teachers registered for your school</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={loading}>
          Refresh
        </Button>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No pending approvals</h3>
            <p className="mt-2 text-neutral-600">All users have been reviewed and approved.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <Card key={user._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getRoleIcon(user.role)}</div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className="text-orange-600 border-orange-200 bg-orange-50">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">{user.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-neutral-400 mt-0.5" />
                        <div>
                          {user.schoolId && typeof user.schoolId === 'object' ? (
                            <>
                              <p className="font-medium text-sm text-neutral-900">{user.schoolId.name}</p>
                              <div className="flex items-center space-x-1 text-xs text-neutral-500">
                                <MapPinIcon className="w-3 h-3" />
                                <span>{user.schoolId.sector}, {user.schoolId.district}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-neutral-500 italic">School information not available</p>
                          )}
                        </div>
                      </div>
                      {user.selectedClass && (
                        <div className="flex items-start space-x-2">
                          <AcademicCapIcon className="w-4 h-4 text-neutral-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-neutral-500">Assigned Class</p>
                            <p className="font-medium text-sm text-neutral-900">{user.selectedClass}</p>
                          </div>
                        </div>
                      )}
                      {user.teacherTitle && (
                        <div className="flex items-start space-x-2">
                          <UserIcon className="w-4 h-4 text-neutral-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-neutral-500">Teaching Title</p>
                            <p className="font-medium text-sm text-neutral-900">{user.teacherTitle}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id || approveUserMutation.isPending}
                      className="flex-1"
                    >
                      {actionLoading === user._id && approveUserMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(user._id)}
                      variant="outline"
                      disabled={actionLoading === user._id || rejectUserMutation.isPending}
                      className="flex-1"
                    >
                      {actionLoading === user._id && rejectUserMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      ) : (
                      <UserMinusIcon className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
