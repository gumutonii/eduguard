import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon
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
  teacherTitle?: string
  adminTitle?: string
  className?: string
  classGrade?: string
  classSection?: string
  isApproved: boolean
  isActive: boolean
  approvedAt?: string
  createdAt: string
  lastLogin?: string
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  // Fetch user details
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.getUserById(userId!),
    enabled: !!userId,
  })

  const user = userData?.data

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
    if (!user.isApproved) return 'Pending Approval'
    return 'Active'
  }

  const getUserTitle = (user: User) => {
    return user.adminTitle || user.teacherTitle || 
           (user.role === 'SUPER_ADMIN' ? 'System Administrator' :
            user.role === 'ADMIN' ? 'Administrator' : 'Teacher')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">User not found or error loading user details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{getUserTitle(user)}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link to={`/users/${user._id}/edit`}>
            <Button>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <p className="text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                {user.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-gray-900 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {user.phone}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                       user.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="text-gray-900">{getUserTitle(user)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(user)}>
                      {getStatusText(user)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Information */}
          {user.schoolName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-600" />
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">School Name</label>
                    <p className="text-gray-900">{user.schoolName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {user.schoolDistrict}, {user.schoolSector}
                    </p>
                  </div>
                  {user.schoolPhone && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">School Phone</label>
                      <p className="text-gray-900">{user.schoolPhone}</p>
                    </div>
                  )}
                  {user.schoolEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">School Email</label>
                      <p className="text-gray-900">{user.schoolEmail}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Information (for Teachers) */}
          {user.role === 'TEACHER' && user.className && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Class Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Class Name</label>
                    <p className="text-gray-900">{user.className}</p>
                  </div>
                  {user.classGrade && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Grade</label>
                      <p className="text-gray-900">{user.classGrade}</p>
                    </div>
                  )}
                  {user.classSection && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Section</label>
                      <p className="text-gray-900">{user.classSection}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Approved</span>
                {user.isApproved ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active</span>
                {user.isActive ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {formatDate(user.createdAt)}
                </p>
              </div>
              {user.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Approved</label>
                  <p className="text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.approvedAt)}
                  </p>
                </div>
              )}
              {user.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Login</label>
                  <p className="text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.lastLogin)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/users/${user._id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </Link>
              {!user.isApproved && (
                <Button variant="outline" className="w-full justify-start text-green-600 hover:text-green-700">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve User
                </Button>
              )}
              {user.isActive ? (
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start text-green-600 hover:text-green-700">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
