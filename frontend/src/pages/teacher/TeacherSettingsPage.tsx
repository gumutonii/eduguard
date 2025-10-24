import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiClient } from '@/lib/api'
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

  // Update forms when profile data is fetched
  useEffect(() => {
    if (userProfile?.data) {
      const profile = userProfile.data
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
      })
      setSchoolForm({
        schoolName: profile.schoolName || '',
        schoolDistrict: profile.schoolDistrict || '',
        schoolSector: profile.schoolSector || '',
        schoolPhone: profile.schoolPhone || '',
        schoolEmail: profile.schoolEmail || '',
      })
      setClassForm({
        className: profile.className || '',
        classGrade: profile.classGrade || '',
        classSection: profile.classSection || '',
      })
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
      }
    },
    onError: () => {
      setUpdateMessage('Failed to update profile. Please try again.')
    }
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate(profileForm)
  }

  const handleSchoolUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate(schoolForm)
  }

  const handleClassUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateMessage('')
    updateProfileMutation.mutate(classForm)
  }

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schoolDistrict" className="block text-sm font-medium text-gray-700">
                    District
                  </label>
                  <input
                    type="text"
                    id="schoolDistrict"
                    value={schoolForm.schoolDistrict}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolDistrict: e.target.value })}
                    className="mt-1 input"
                    placeholder="e.g., Gasabo"
                  />
                </div>

                <div>
                  <label htmlFor="schoolSector" className="block text-sm font-medium text-gray-700">
                    Sector
                  </label>
                  <input
                    type="text"
                    id="schoolSector"
                    value={schoolForm.schoolSector}
                    onChange={(e) => setSchoolForm({ ...schoolForm, schoolSector: e.target.value })}
                    className="mt-1 input"
                    placeholder="e.g., Kimisagara"
                  />
                </div>
              </div>

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

        {/* Class Information */}
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

              {(user as any)?.className && (
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}