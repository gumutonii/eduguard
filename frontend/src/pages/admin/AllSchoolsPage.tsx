import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BuildingOfficeIcon, 
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'

export function AllSchoolsPage() {
  const { data: schoolsData, isLoading: schoolsLoading, error: schoolsError } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => apiClient.getAllSchools(),
  })

  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => apiClient.getSystemStats(),
  })

  if (schoolsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">All Schools</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (schoolsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">All Schools</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading schools</h3>
            <p className="mt-2 text-gray-600">Failed to fetch school data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const schools = schoolsData?.data || []
  const stats = systemStats?.data || {} as any

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Schools</h1>
          <p className="text-gray-600">Manage and view all schools in the system</p>
        </div>
        <div className="text-sm text-gray-500">
          {schools.length} total schools
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRiskStudents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools List */}
      {schools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No schools found</h3>
            <p className="mt-2 text-gray-600">No schools have been registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {schools.map((school, index) => (
            <Link key={school._id || index} to={`/schools/${school._id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{school.name || school.schoolName}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {school.district || school.schoolDistrict}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {school.sector || school.schoolSector}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {school.totalUsers || 0} users
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(school.phone || school.schoolPhone) && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{school.phone || school.schoolPhone}</span>
                      </div>
                    )}
                    {(school.email || school.schoolEmail) && (
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{school.email || school.schoolEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{school.totalUsers || 0}</div>
                        <div className="text-gray-500">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{school.admins || 0}</div>
                        <div className="text-gray-500">Admins</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{school.teachers || 0}</div>
                        <div className="text-gray-500">Teachers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{school.totalStudents || 0}</div>
                        <div className="text-gray-500">Students</div>
                      </div>
                    </div>
                  </div>

                  {(school.atRiskStudents || 0) > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            {school.atRiskStudents || 0} at-risk students
                          </span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {school.riskRate || 0}% risk rate
                        </Badge>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
