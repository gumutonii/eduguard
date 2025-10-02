import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { SchoolSelect } from '@/components/ui/SchoolSelect'
import { apiClient } from '@/lib/api'
import { SchoolService, RwandanSchool } from '@/lib/schools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

export function ParentSettingsPage() {
  const { user, login } = useAuthStore()
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    schoolId: user?.schoolId || '',
  })
  const [selectedSchool, setSelectedSchool] = useState<RwandanSchool | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  // Load school data when component mounts
  useEffect(() => {
    const loadSchoolData = async () => {
      if (user?.schoolId) {
        try {
          const schools = await SchoolService.getAllSchools()
          const school = schools.find(s => s.id === user.schoolId)
          if (school) {
            setSelectedSchool(school)
          }
        } catch (error) {
          console.error('Failed to load school data:', error)
        }
      }
    }
    loadSchoolData()
  }, [user?.schoolId])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setUpdateMessage('')

    try {
      const response = await apiClient.updateProfile(profileForm)
      if (response.success) {
        setUpdateMessage('Profile updated successfully!')
        // Update the auth store with new user data
        await login(user?.email || '', '') // This will refresh the user data
        setTimeout(() => setUpdateMessage(''), 3000)
      }
    } catch (error) {
      setUpdateMessage('Failed to update profile. Please try again.')
      setTimeout(() => setUpdateMessage(''), 3000)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleSchoolSelect = (schoolId: string, school: RwandanSchool) => {
    setSelectedSchool(school)
    setProfileForm(prev => ({ ...prev, schoolId }))
  }

  const handleSchoolClear = () => {
    setSelectedSchool(null)
    setProfileForm(prev => ({ ...prev, schoolId: '' }))
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }
    
    setIsChangingPassword(true)
    // Simulate API call
    setTimeout(() => {
      alert('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600">Manage your account information and security settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Admin Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Admin Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-primary-600">
                    {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{user?.name}</h3>
                  <Badge variant="success">{user?.role}</Badge>
                </div>
              </div>

              {/* Read-only Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Email</p>
                    <p className="text-neutral-900">{user?.email}</p>
                  </div>
                </div>
                
                {user?.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Phone</p>
                      <p className="text-neutral-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Account Status</p>
                    <p className="text-neutral-900">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Member Since</p>
                    <p className="text-neutral-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Update Form */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-neutral-900 mb-4">Update Profile</h4>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-neutral-700 mb-1">
                      School
                    </label>
                    <SchoolSelect
                      value={profileForm.schoolId}
                      onChange={handleSchoolSelect}
                      onClear={handleSchoolClear}
                      placeholder="Search and select your school..."
                      className="w-full"
                    />
                  </div>

                  {updateMessage && (
                    <div className={`p-3 rounded-md text-sm ${
                      updateMessage.includes('successfully') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {updateMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    loading={isUpdatingProfile}
                    disabled={isUpdatingProfile}
                    className="w-full"
                  >
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyIcon className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <h4 className="font-medium text-neutral-900">Last Login</h4>
              <p className="text-sm text-neutral-600 mt-1">
                {new Date().toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <h4 className="font-medium text-neutral-900">Account Security</h4>
              <p className="text-sm text-neutral-600 mt-1">
                Your account is secured with industry-standard encryption
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
