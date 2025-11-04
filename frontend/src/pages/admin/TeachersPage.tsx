import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon
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
  schoolPhone?: string
  schoolEmail?: string
  className?: string
  classGrade?: string
  classSection?: string
  teacherTitle?: string
  adminTitle?: string
  isApproved: boolean
  isActive: boolean
  approvedAt?: string
  createdAt: string
  lastLogin?: string
}

export function TeachersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const queryClient = useQueryClient()

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      fetchUsers(pagination.page, searchQuery)
    }
  })

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const response = await apiClient.getUsers({
        page,
        limit: pagination.limit,
        search: search || undefined
      })
      
      if (response.success) {
        setUsers(response.data)
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1, searchQuery)
  }

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, searchQuery)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'TEACHER': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'ADMIN': return 'Admin'
      case 'TEACHER': return 'Teacher'
      default: return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
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
          <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-600">Manage and view all users in the system</p>
        </div>
        <div className="text-sm text-neutral-500">
          {pagination.total} total users
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                fetchUsers(1, '')
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No users found</h3>
            <p className="mt-2 text-neutral-600">
              {searchQuery ? 'No users match your search criteria.' : 'No users have been registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr 
                      key={user._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/teachers/${user._id}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                              <span className="text-sm font-medium text-primary-600">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">
                          {user.teacherTitle || user.adminTitle || 'Teacher'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {user.className ? (
                          <p className="text-sm text-blue-600">Class: {user.className}</p>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-1">
                            {user.isApproved ? (
                              <>
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600 font-medium">Approved</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                                <span className="text-xs text-orange-600 font-medium">Pending</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/teachers/${user._id}`
                            }}
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/users/${user._id}/edit`
                            }}
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                deleteUserMutation.mutate(user._id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-2 text-sm text-neutral-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
