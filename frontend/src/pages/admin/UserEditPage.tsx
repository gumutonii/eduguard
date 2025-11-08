import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import DistrictSectorSelect from '@/components/ui/DistrictSectorSelect'

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
  createdAt: string
}

export function UserEditPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch user details
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.getUserById(userId!),
    enabled: !!userId,
  })

  const user = userData?.data

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teacherTitle: '',
    adminTitle: '',
    className: '',
    classGrade: '',
    classSection: '',
    schoolName: '',
    schoolDistrict: '',
    schoolSector: '',
    schoolPhone: '',
    schoolEmail: '',
    isApproved: false,
    isActive: false,
  })

  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolDistrict: '',
    schoolSector: '',
    schoolPhone: '',
    schoolEmail: '',
  })

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        teacherTitle: user.teacherTitle || '',
        adminTitle: user.adminTitle || '',
        className: user.className || '',
        classGrade: user.classGrade || '',
        classSection: user.classSection || '',
        schoolName: user.schoolName || '',
        schoolDistrict: user.schoolDistrict || '',
        schoolSector: user.schoolSector || '',
        schoolPhone: user.schoolPhone || '',
        schoolEmail: user.schoolEmail || '',
        isApproved: user.isApproved || false,
        isActive: user.isActive || false,
      })

      setSchoolForm({
        schoolName: user.schoolName || '',
        schoolDistrict: user.schoolDistrict || '',
        schoolSector: user.schoolSector || '',
        schoolPhone: user.schoolPhone || '',
        schoolEmail: user.schoolEmail || '',
      })
    }
  }, [user])

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateUser(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      navigate(`/users/${userId}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const userData = {
      name: formData.name,
      phone: formData.phone,
      teacherTitle: formData.teacherTitle,
      adminTitle: formData.adminTitle,
      className: formData.className,
      classGrade: formData.classGrade,
      classSection: formData.classSection,
      isApproved: formData.isApproved,
      isActive: formData.isActive,
    }

    const schoolData = {
      schoolName: schoolForm.schoolName,
      schoolDistrict: schoolForm.schoolDistrict,
      schoolSector: schoolForm.schoolSector,
      schoolPhone: schoolForm.schoolPhone,
      schoolEmail: schoolForm.schoolEmail,
    }

    updateUserMutation.mutate({ ...userData, ...schoolData })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSchoolInputChange = (field: string, value: any) => {
    setSchoolForm(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">{user.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {user.role === 'ADMIN' ? 'Admin Title' : 'Teacher Title'}
                  </label>
                  <input
                    type="text"
                    value={user.role === 'ADMIN' ? formData.adminTitle : formData.teacherTitle}
                    onChange={(e) => handleInputChange(
                      user.role === 'ADMIN' ? 'adminTitle' : 'teacherTitle', 
                      e.target.value
                    )}
                    placeholder={user.role === 'ADMIN' ? 'e.g., Head Teacher' : 'e.g., Mathematics Teacher'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'high' : user.role === 'ADMIN' ? 'medium' : 'low'}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                       user.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Class Information for Teachers */}
              {user.role === 'TEACHER' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900">Class Assignment</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Name
                      </label>
                      <input
                        type="text"
                        value={formData.className}
                        onChange={(e) => handleInputChange('className', e.target.value)}
                        placeholder="e.g., S3A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <input
                        type="text"
                        value={formData.classGrade}
                        onChange={(e) => handleInputChange('classGrade', e.target.value)}
                        placeholder="e.g., S3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        value={formData.classSection}
                        onChange={(e) => handleInputChange('classSection', e.target.value)}
                        placeholder="e.g., A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-600" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolForm.schoolName}
                  onChange={(e) => handleSchoolInputChange('schoolName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <DistrictSectorSelect
                selectedDistrict={schoolForm.schoolDistrict}
                selectedSector={schoolForm.schoolSector}
                onDistrictChange={(district) => handleSchoolInputChange('schoolDistrict', district)}
                onSectorChange={(sector) => handleSchoolInputChange('schoolSector', sector)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Phone
                  </label>
                  <input
                    type="tel"
                    value={schoolForm.schoolPhone}
                    onChange={(e) => handleSchoolInputChange('schoolPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Email
                  </label>
                  <input
                    type="email"
                    value={schoolForm.schoolEmail}
                    onChange={(e) => handleSchoolInputChange('schoolEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-purple-600" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Approved Status</label>
                    <p className="text-xs text-gray-500">User can access the system</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isApproved}
                      onChange={(e) => handleInputChange('isApproved', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Active Status</label>
                    <p className="text-xs text-gray-500">User account is active</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/users/${userId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckIcon className="h-4 w-4 mr-2" />
            )}
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
