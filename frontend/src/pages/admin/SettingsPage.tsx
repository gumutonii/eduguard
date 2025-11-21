import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function SettingsPage() {
  const { user: authUser, login } = useAuthStore()
  const queryClient = useQueryClient()
  
  // Fetch complete user profile from database
  // Use user ID in query key to ensure cache isolation per user
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', authUser?._id],
    queryFn: () => apiClient.getProfile(),
    enabled: !!authUser?._id, // Only fetch if user is authenticated
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  })

  const isSuperAdmin = userProfile?.data?.role === 'SUPER_ADMIN'

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
  const [classForm, setClassForm] = useState({
    className: '',
    classGrade: '',
    classSection: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [updateMessage, setUpdateMessage] = useState('')
  const [uploadingPicture, setUploadingPicture] = useState(false)

  // Mutations for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateProfile(profileData),
    onSuccess: (response) => {
      // Update auth store if token is provided
      if (response.success && response.data?.token && response.data?.user) {
        login(response.data.user, response.data.token)
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', authUser?._id] })
      setUpdateMessage('Profile updated successfully!')
      setTimeout(() => setUpdateMessage(''), 3000)
    },
    onError: (error: any) => {
      setUpdateMessage(error.message || 'Failed to update profile')
      setTimeout(() => setUpdateMessage(''), 5000)
    }
  })

  const uploadPictureMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadProfilePicture(file),
    onSuccess: (response) => {
      // Update auth store if token is provided
      if (response.success && response.data?.token && response.data?.user) {
        login(response.data.user, response.data.token)
      }
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', authUser?._id] })
      setUpdateMessage('Profile picture uploaded successfully!')
      setTimeout(() => setUpdateMessage(''), 3000)
    },
    onError: (error: any) => {
      setUpdateMessage(error.message || 'Failed to upload profile picture')
      setTimeout(() => setUpdateMessage(''), 5000)
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: (passwordData: any) => apiClient.changePassword(passwordData),
    onSuccess: () => {
      setUpdateMessage('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      setUpdateMessage(error.message || 'Failed to change password')
    }
  })

  // Update forms when user profile data is loaded
  useEffect(() => {
    if (userProfile?.data) {
      const user = userProfile.data
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
      if (!isSuperAdmin) {
      setSchoolForm({
        schoolName: user.schoolName || '',
        schoolDistrict: user.schoolDistrict || '',
        schoolSector: user.schoolSector || '',
        schoolPhone: user.schoolPhone || '',
        schoolEmail: user.schoolEmail || '',
      })
      setClassForm({
        className: user.className || '',
        classGrade: user.classGrade || '',
        classSection: user.classSection || '',
      })
    }
    }
  }, [userProfile, isSuperAdmin])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    if (isSuperAdmin) {
      updateProfileMutation.mutate({
        name: profileForm.name,
        phone: profileForm.phone,
      })
    } else {
    updateProfileMutation.mutate({
      name: profileForm.name,
      phone: profileForm.phone,
    })
    }
  }

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate({
      schoolName: schoolForm.schoolName,
      schoolDistrict: schoolForm.schoolDistrict,
      schoolSector: schoolForm.schoolSector,
      schoolPhone: schoolForm.schoolPhone,
      schoolEmail: schoolForm.schoolEmail,
    })
  }

  const handleClassUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate({
      className: classForm.className,
      classGrade: classForm.classGrade,
      classSection: classForm.classSection,
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setUpdateMessage('New passwords do not match')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
  }

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
        setUploadingPicture(false)
        e.target.value = '' // Reset input
      }
    })
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">{isSuperAdmin ? 'Manage your account information' : 'Manage your account and school information'}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Simplified Super Admin Profile Page
  if (isSuperAdmin) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
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
                      {userProfile?.data?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                  {userProfile?.data?.name || 'User'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {userProfile?.data?.email || ''}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-600"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+250 788 000 000"
                  />
                </div>
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
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
    )
  }

  // Regular Admin/Teacher Settings Page
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and school information</p>
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
            {/* Profile Picture Upload */}
            <div className="mb-6 flex items-center gap-6">
              <div className="relative">
                {userProfile?.data?.profilePicture ? (
                  <img
                    src={userProfile.data.profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {uploadingPicture && (
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex-1">
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

        {/* Super Admin System Information */}
        {userProfile?.data?.role === 'SUPER_ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Super Admin Account</h4>
                  <p className="text-sm text-blue-700">
                    You have full system access and can manage all schools, users, and system settings.
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Email:</strong> {userProfile?.data?.email}</p>
                  <p><strong>Role:</strong> Super Administrator</p>
                  <p><strong>Access Level:</strong> System-wide</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Information (for Teachers) */}
        {userProfile?.data?.role === 'TEACHER' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClassUpdate} className="space-y-4">
                <div>
                  <label htmlFor="className" className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <input
                    type="text"
                    id="className"
                    value={classForm.className}
                    onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                    className="mt-1 input"
                    placeholder="e.g., P1 A, S6 PCB, S4 MEG"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classGrade" className="block text-sm font-medium text-gray-700">
                      Grade
                    </label>
                    <input
                      type="text"
                      id="classGrade"
                      value={classForm.classGrade}
                      onChange={(e) => setClassForm({ ...classForm, classGrade: e.target.value })}
                      className="mt-1 input"
                      placeholder="e.g., P1, S6, S4"
                    />
                  </div>

                  <div>
                    <label htmlFor="classSection" className="block text-sm font-medium text-gray-700">
                      Section
                    </label>
                    <input
                      type="text"
                      id="classSection"
                      value={classForm.classSection}
                      onChange={(e) => setClassForm({ ...classForm, classSection: e.target.value })}
                      className="mt-1 input"
                      placeholder="e.g., A, B, C"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  Update Class Information
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

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
                alt={userProfile?.data?.name || 'Profile'}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                <span className="text-xl font-semibold text-primary-600">
                  {(userProfile?.data?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userProfile?.data?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500">
                {userProfile?.data?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                 userProfile?.data?.role === 'ADMIN' ? 'Administrator' : 
                 userProfile?.data?.role === 'TEACHER' ? 'Teacher' : userProfile?.data?.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{userProfile?.data?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Role</p>
                  <Badge variant={userProfile?.data?.role === 'SUPER_ADMIN' ? 'high' : userProfile?.data?.role === 'ADMIN' ? 'medium' : 'low'}>
                    {userProfile?.data?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                     userProfile?.data?.role === 'ADMIN' ? 'Administrator' : 
                     userProfile?.data?.role === 'TEACHER' ? 'Teacher' : userProfile?.data?.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {userProfile?.data?.schoolName && (
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">School</p>
                    <p className="text-sm text-gray-600">{userProfile?.data?.schoolName}</p>
                    {userProfile?.data?.schoolDistrict && (
                      <p className="text-xs text-gray-500">{userProfile?.data?.schoolDistrict}, {userProfile?.data?.schoolSector}</p>
                    )}
                  </div>
                </div>
              )}

              {userProfile?.data?.role === 'SUPER_ADMIN' && (
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">System Access</p>
                    <p className="text-sm text-gray-600">Full system administration</p>
                    <p className="text-xs text-gray-500">Manage all schools, users, and settings</p>
                  </div>
                </div>
              )}

              {userProfile?.data?.role === 'TEACHER' && userProfile?.data?.className && (
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Class</p>
                    <p className="text-sm text-gray-600">{userProfile?.data?.className}</p>
                    {userProfile?.data?.classGrade && (
                      <p className="text-xs text-gray-500">Grade: {userProfile?.data?.classGrade}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}