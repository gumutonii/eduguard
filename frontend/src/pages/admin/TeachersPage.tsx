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
  PencilIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER'
  schoolName?: string
  schoolDistrict?: string
  schoolSector?: string
  schoolPhone?: string
  schoolEmail?: string
  className?: string
  classGrade?: string
  classSection?: string
  isApproved: boolean
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
          <h1 className="text-2xl font-bold text-neutral-900">All Users</h1>
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
          <h1 className="text-2xl font-bold text-neutral-900">All Users</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                          deleteUserMutation.mutate(user._id);
                        }
                      }}
                      disabled={deleteUserMutation.isPending}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Role</span>
                    <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <div className="flex items-center space-x-1">
                      {user.isApproved ? (
                        <>
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-600 font-medium">Approved</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                          <span className="text-orange-600 font-medium">Pending</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.schoolName && (
                    <div className="border-t pt-2">
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-3 w-3 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{user.schoolName}</p>
                          {user.schoolDistrict && (
                            <p className="text-xs text-gray-500 truncate">{user.schoolDistrict}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {user.className && (
                    <div className="border-t pt-2">
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-3 w-3 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">Class: {user.className}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        // View details functionality
                      }}
                    >
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
