import React, { useState, useEffect } from 'react'
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
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface Teacher {
  _id: string
  name: string
  email: string
  phone?: string
  schoolId?: {
    _id: string
    name: string
    type: 'PRIMARY' | 'SECONDARY'
    district: string
    province: string
  } | null
  isApproved: boolean
  approvedAt?: string
  createdAt: string
  lastLogin?: string
}

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchTeachers = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const response = await apiClient.getTeachers({
        page,
        limit: pagination.limit,
        search: search || undefined
      })
      
      if (response.success) {
        setTeachers(response.data)
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTeachers(1, searchQuery)
  }

  const handlePageChange = (newPage: number) => {
    fetchTeachers(newPage, searchQuery)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'TEACHER': return 'bg-blue-100 text-blue-800'
      case 'PARENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-neutral-900">Teachers</h1>
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
          <h1 className="text-2xl font-bold text-neutral-900">Teachers</h1>
          <p className="text-neutral-600">Manage and view all teachers in the system</p>
        </div>
        <div className="text-sm text-neutral-500">
          {pagination.total} total teachers
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
                placeholder="Search teachers by name or email..."
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
                fetchTeachers(1, '')
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No teachers found</h3>
            <p className="mt-2 text-neutral-600">
              {searchQuery ? 'No teachers match your search criteria.' : 'No teachers have been registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {teachers.map((teacher) => (
            <Card key={teacher._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600">
                        {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{teacher.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRoleColor('TEACHER')}>
                          TEACHER
                        </Badge>
                        {teacher.isApproved ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500">
                    Joined {formatDate(teacher.createdAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">{teacher.phone}</span>
                      </div>
                    )}
                    {teacher.lastLogin && (
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">
                          Last login: {formatDate(teacher.lastLogin)}
                        </span>
                      </div>
                    )}
                  </div>

                  {teacher.schoolId && (
                    <div className="border-t pt-4">
                      <div className="flex items-start space-x-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-neutral-900">{teacher.schoolId.name}</p>
                          <div className="flex items-center space-x-1 text-xs text-neutral-500">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{teacher.schoolId.district}, {teacher.schoolId.province}</span>
                          </div>
                          <Badge className="mt-1 text-xs bg-gray-100 text-gray-800">
                            {teacher.schoolId.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {!teacher.schoolId && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-neutral-500 italic">No school information available</p>
                    </div>
                  )}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} teachers
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
