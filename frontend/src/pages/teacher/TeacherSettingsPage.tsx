import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiClient } from '@/lib/api'
import DistrictSectorSelect from '@/components/ui/DistrictSectorSelect'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  KeyIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

export function TeacherSettingsPage() {
  const { user, login } = useAuthStore()
  const queryClient = useQueryClient()
  
  // Fetch user profile data dynamically
  // Use user ID in query key to ensure cache isolation per user
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?._id],
    queryFn: () => apiClient.getProfile(),
    enabled: !!user?._id, // Only fetch if user is authenticated
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  })

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolDistrict: '',
    schoolSector: '',
    schoolPhone: '',
    schoolEmail: '',
  })
  const [assignedClassDetails, setAssignedClassDetails] = useState<{
    _id?: string
    className?: string
    grade?: string
    section?: string
    academicYear?: string
    studentCount?: number
    maxCapacity?: number
    description?: string
    isActive?: boolean
  } | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [updateMessage, setUpdateMessage] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?._id] })
      setUpdateMessage('Profile picture uploaded successfully!')
      setUploadingPicture(false)
    },
    onError: (error: any) => {
      setUpdateMessage(error.message || 'Failed to upload profile picture')
      setUploadingPicture(false)
    }
  })

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUpdateMessage('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateMessage('Image size must be less than 5MB')
      return
    }

    setUploadingPicture(true)
    setUpdateMessage('')
    uploadPictureMutation.mutate(file, {
      onSettled: () => {
        e.target.value = '' // Reset input
      }
    })
  }

  // Update forms when profile data is fetched
  useEffect(() => {
    if (userProfile?.data) {
      const profile = userProfile.data
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
      setSchoolForm({
        schoolName: profile.schoolName || '',
        schoolDistrict: profile.schoolDistrict || '',
        schoolSector: profile.schoolSector || '',
        schoolPhone: profile.schoolPhone || '',
        schoolEmail: profile.schoolEmail || '',
      })
      // Set assigned class details if available
      if (profile.assignedClassDetails) {
        setAssignedClassDetails(profile.assignedClassDetails)
      } else if (profile.className) {
        // Fallback to basic class info if detailed class not available
        setAssignedClassDetails({
          className: profile.className,
          grade: profile.classGrade || '',
          section: profile.classSection || '',
        })
      } else {
        setAssignedClassDetails(null)
      }
    }
  }, [userProfile])

  // React Query mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateProfile(data),
    onSuccess: (response) => {
      if (response.success) {
        login(response.data.user, response.data.token)
        setUpdateMessage('Profile updated successfully!')
        setTimeout(() => setUpdateMessage(''), 3000)
        queryClient.invalidateQueries({ queryKey: ['user-profile'] })
        queryClient.invalidateQueries({ queryKey: ['user-profile', user?._id] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
      }
    },
    onError: () => {
      setUpdateMessage('Failed to update profile. Please try again.')
    }
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    // Don't send email in the update - it's read-only
    const { email, ...updateData } = profileForm
    updateProfileMutation.mutate(updateData)
  }

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate(schoolForm)
  }

  // Note: Class assignment is managed by admins, so no update function needed

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      apiClient.changePassword(data),
    onSuccess: (response) => {
      if (response.success) {
        setUpdateMessage('Password changed successfully!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        setUpdateMessage('Failed to change password. Please check your current password.')
      }
    },
    onError: () => {
      setUpdateMessage('Failed to change password. Please try again.')
    }
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setUpdateMessage('New passwords do not match.')
      return
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account, school, and class information</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account, school, and class information</p>
      </div>

      {updateMessage && (
        <div className={`p-4 rounded-md ${
          updateMessage.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {updateMessage}
        </div>
      )}

      {/* Profile Picture Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {userProfile?.data?.profilePicture ? (
                <img
                  src={userProfile.data.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                  <span className="text-3xl font-semibold text-primary-600">
                    {userProfile?.data?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'T'}
                  </span>
                </div>
              )}
              {uploadingPicture && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {userProfile?.data?.name || user?.name || 'Teacher'}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {userProfile?.data?.email || user?.email || ''}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                disabled={uploadingPicture}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="mt-1 input"
                  required
                    />
                  </div>

                  <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profileForm.email}
                      disabled
                      className="mt-1 input bg-gray-50 cursor-not-allowed"
                      placeholder="your.email@example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed. Contact administrator if you need to update it.
                    </p>
                  </div>

                  <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 input"
                  placeholder="+250 788 000 000"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={updateProfileMutation.isPending}
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchoolUpdate} className="space-y-4">
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                  School Name
                </label>
                <input
                  type="text"
                  id="schoolName"
                  value={schoolForm.schoolName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                  className="mt-1 input"
                  placeholder="Enter your school name"
                />
              </div>

              <DistrictSectorSelect
                selectedDistrict={schoolForm.schoolDistrict}
                selectedSector={schoolForm.schoolSector}
                onDistrictChange={(district) => setSchoolForm({ ...schoolForm, schoolDistrict: district })}
                onSectorChange={(sector) => setSchoolForm({ ...schoolForm, schoolSector: sector })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700">
                    School Phone
                  </label>
                  <input
                    type="tel"
                    id="schoolPhone"
                    value={schoolForm.schoolPhone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolPhone: e.target.value })}
                    className="mt-1 input"
                    placeholder="+250 788 000 000"
                  />
                </div>

                <div>
                  <label htmlFor="schoolEmail" className="block text-sm font-medium text-gray-700">
                    School Email
                  </label>
                  <input
                    type="email"
                    id="schoolEmail"
                    value={schoolForm.schoolEmail}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolEmail: e.target.value })}
                    className="mt-1 input"
                    placeholder="school@example.com"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
                className="w-full"
              >
                Update School Information
                  </Button>
                </form>
          </CardContent>
        </Card>

        {/* Assigned Class Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5" />
              Assigned Class Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedClassDetails ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Class assignment is managed by your school administrator. 
                    Contact them if you need to be reassigned to a different class.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Class Name
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {assignedClassDetails.className || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Academic Year
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {assignedClassDetails.academicYear || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {assignedClassDetails.grade || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Section
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {assignedClassDetails.section || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Students
                    </label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {assignedClassDetails.studentCount || 0} / {assignedClassDetails.maxCapacity || 0} 
                      {assignedClassDetails.maxCapacity && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({(assignedClassDetails.studentCount || 0) / (assignedClassDetails.maxCapacity || 1) * 100}% capacity)
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <Badge variant={assignedClassDetails.isActive ? 'success' : 'error'} className="mt-1">
                      {assignedClassDetails.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {assignedClassDetails.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {assignedClassDetails.description}
                    </p>
                  </div>
                )}

                {assignedClassDetails._id && (
                  <div className="pt-4 border-t">
                    <Link
                      to="/students"
                      className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                    >
                      View My Students →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Class Assigned</h3>
                <p className="mt-2 text-sm text-gray-600">
                  You have not been assigned to a class yet. Your school administrator will assign you to a class after your account is approved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="mt-1 input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="mt-1 input"
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="mt-1 input"
                  required
                  minLength={8}
                />
              </div>

                <Button 
                  type="submit" 
                loading={changePasswordMutation.isPending}
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                Change Password
                </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Profile Picture Display */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            {userProfile?.data?.profilePicture ? (
              <img
                src={userProfile.data.profilePicture}
                alt={userProfile?.data?.name || user?.name || 'Profile'}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                <span className="text-xl font-semibold text-primary-600">
                  {(userProfile?.data?.name || user?.name || 'T').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userProfile?.data?.name || user?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500">
                {user?.role === 'TEACHER' ? 'Teacher' : user?.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Role</p>
                  <Badge variant="low">Teacher</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(user as any)?.schoolName && (
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">School</p>
                    <p className="text-sm text-gray-600">{(user as any).schoolName}</p>
                    {(user as any).schoolDistrict && (
                      <p className="text-xs text-gray-500">{(user as any).schoolDistrict}, {(user as any).schoolSector}</p>
                    )}
                  </div>
                </div>
              )}

              {assignedClassDetails ? (
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned Class</p>
                    <p className="text-sm text-gray-600">{assignedClassDetails.className}</p>
                    {assignedClassDetails.grade && assignedClassDetails.section && (
                      <p className="text-xs text-gray-500">
                        {assignedClassDetails.grade} - Section {assignedClassDetails.section}
                      </p>
                    )}
                    {assignedClassDetails.studentCount !== undefined && (
                      <p className="text-xs text-gray-500">
                        {assignedClassDetails.studentCount} students
                      </p>
                    )}
                  </div>
                </div>
              ) : (user as any)?.className ? (
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Class</p>
                    <p className="text-sm text-gray-600">{(user as any).className}</p>
                    {(user as any).classGrade && (
                      <p className="text-xs text-gray-500">Grade: {(user as any).classGrade}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}