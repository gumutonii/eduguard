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
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getProfile(),
  })

  const [profileForm, setProfileForm] = useState({
    name: '',
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

  // Mutations for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      setUpdateMessage('Profile updated successfully!')
    },
    onError: (error: any) => {
      setUpdateMessage(error.message || 'Failed to update profile')
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
        phone: user.phone || '',
      })
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
  }, [userProfile])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate({
      name: profileForm.name,
      phone: profileForm.phone,
    })
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

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and school information</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

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