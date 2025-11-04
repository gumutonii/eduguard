import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER'
  profilePicture?: string
  schoolName?: string
  schoolDistrict?: string
  schoolSector?: string
  teacherTitle?: string
  adminTitle?: string
  className?: string
  isApproved: boolean
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export function AllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const queryClient = useQueryClient()

  // Fetch all users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => apiClient.getAllUsers(),
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
    },
  })

  const users = usersData?.data || []

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user._id)
    }
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchQuery))
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'APPROVED' && user.isApproved) ||
                         (statusFilter === 'PENDING' && !user.isApproved) ||
                         (statusFilter === 'ACTIVE' && user.isActive) ||
                         (statusFilter === 'INACTIVE' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'high'
      case 'ADMIN': return 'medium'
      case 'TEACHER': return 'low'
      default: return 'low'
    }
  }

  const getStatusBadgeVariant = (user: User) => {
    if (!user.isActive) return 'error'
    if (!user.isApproved) return 'warning'
    return 'success'
  }

  const getStatusText = (user: User) => {
    if (!user.isActive) return 'Inactive'
    if (!user.isApproved) return 'Pending'
    return 'Active'
  }

  const getUserTitle = (user: User) => {
    return user.adminTitle || user.teacherTitle || 
           (user.role === 'SUPER_ADMIN' ? 'System Administrator' :
            user.role === 'ADMIN' ? 'Administrator' : 'Teacher')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">Error loading users. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all administrators and teachers in the system</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-40 lg:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Administrator</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">User</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">Role</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">Title</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">School</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user: User) => (
                        <tr 
                          key={user._id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => window.location.href = `/users/${user._id}`}
                        >
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-primary-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-primary-200 flex-shrink-0">
                                  <span className="text-xs sm:text-sm font-medium text-blue-600">
                                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                {/* Mobile: Show role and status inline */}
                                <div className="sm:hidden mt-1 flex items-center gap-2">
                                  <Badge variant={getRoleBadgeVariant(user)} className="text-xs">
                                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                     user.role === 'ADMIN' ? 'Admin' : 'Teacher'}
                                  </Badge>
                                  <Badge variant={getStatusBadgeVariant(user)} className="text-xs">
                                    {getStatusText(user)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden sm:table-cell">
                            <Badge variant={getRoleBadgeVariant(user)}>
                              {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                               user.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden md:table-cell">
                            <p className="text-sm text-gray-900">{getUserTitle(user)}</p>
                            {user.className && (
                              <p className="text-xs text-gray-500">Class: {user.className}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden lg:table-cell">
                            {user.schoolName ? (
                              <div>
                                <p className="text-sm text-gray-900 font-medium">{user.schoolName}</p>
                                {user.schoolDistrict && user.schoolSector && (
                                <p className="text-xs text-gray-500">
                                  {user.schoolDistrict}, {user.schoolSector}
                                </p>
                                )}
                              </div>
                            ) : user.role === 'SUPER_ADMIN' ? (
                              <span className="text-sm text-gray-400 italic">System-wide</span>
                            ) : (
                              <span className="text-sm text-gray-400">No school</span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden sm:table-cell">
                            <Badge variant={getStatusBadgeVariant(user)}>
                              {getStatusText(user)}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Link 
                                to={`/users/${user._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  title="View"
                                >
                                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </Link>
                              <Link 
                                to={`/users/${user._id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(user)
                                }}
                                disabled={deleteUserMutation.isPending}
                                title="Delete"
                              >
                                <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
