import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  AcademicCapIcon, 
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

export function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>()

  // Fetch school details (includes school, classes, users, statistics)
  const { data: schoolData, isLoading: schoolLoading } = useQuery({
    queryKey: ['school-detail', schoolId],
    queryFn: () => apiClient.getSchoolById(schoolId!),
    enabled: !!schoolId
  })

  const isLoading = schoolLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/schools">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Schools
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loading School Details...</h1>
            <p className="text-gray-600">Please wait while we fetch the school information</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Extract data from the response
  const school = schoolData?.data?.school || schoolData?.data
  const users = schoolData?.data?.users || []
  const classes = schoolData?.data?.classes || []

  if (!school) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/schools">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Schools
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Not Found</h1>
            <p className="text-gray-600">The requested school could not be found</p>
          </div>
        </div>
      </div>
    )
  }

  // Separate admins and teachers
  const admins = users.filter((user: any) => user.role === 'ADMIN')
  const teachers = users.filter((user: any) => user.role === 'TEACHER')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/schools">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Schools
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{school.name || school.schoolName || 'School'}</h1>
          <p className="text-gray-600">School Details & Management</p>
        </div>
      </div>

      {/* School Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-blue-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-gray-900">{admins.length}</p>
              </div>
              <UserGroupIcon className="h-12 w-12 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
              </div>
              <AcademicCapIcon className="h-12 w-12 text-purple-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Classes</p>
                <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-orange-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">School Name</p>
                  <p className="text-sm text-gray-600">{school.name || school.schoolName || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">
                    {school.district || 'N/A'}, {school.sector || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {school.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{school.phone}</p>
                  </div>
                </div>
              )}

              {school.email && (
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{school.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
              Administrators ({admins.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length > 0 ? (
            <div className="space-y-3">
              {admins.map((admin: any) => (
                <div key={admin._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {admin.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-500">
                        {admin.adminTitle || admin.teacherTitle || 'Administrator'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Administrator</Badge>
                    <Badge variant={admin.isActive ? 'success' : 'error'}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No administrators found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-purple-600" />
              Teachers ({teachers.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Teacher</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher: any) => (
                    <tr 
                      key={teacher._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/users/${teacher._id}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {teacher.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900">
                          {teacher.teacherTitle || teacher.adminTitle || 'Teacher'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {teacher.className ? (
                          <p className="text-sm text-blue-600">Class: {teacher.className}</p>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <Badge variant={teacher.isActive ? 'success' : 'error'}>
                            {teacher.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant={teacher.isApproved ? 'success' : 'warning'}>
                            {teacher.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Link 
                            to={`/teachers/${teacher._id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                          <Button 
                            size="sm" 
                            variant="outline"
                              className="h-8 w-8 p-0"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link 
                            to={`/users/${teacher._id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                          <Button 
                            size="sm" 
                            variant="outline"
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                          </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No teachers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-orange-600" />
              Classes ({classes.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem: any) => (
                <Link 
                  key={classItem._id} 
                  to={`/classes/${classItem._id}?schoolId=${schoolId}`}
                  className="block"
                >
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{classItem.className || classItem.name}</h3>
                    <Badge variant="info">{classItem.studentCount || 0} students</Badge>
                  </div>
                    <p className="text-sm text-gray-500 mb-3">Class {classItem.className || classItem.name}</p>
                    {classItem.assignedTeacher && (
                      <p className="text-xs text-gray-400 mb-2">
                        {classItem.assignedTeacher.teacherTitle || 'Teacher'}: {classItem.assignedTeacher.name}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Grade: {classItem.grade || 'N/A'}
                    </div>
                    <Badge variant={classItem.isActive ? 'success' : 'error'}>
                      {classItem.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No classes found</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
