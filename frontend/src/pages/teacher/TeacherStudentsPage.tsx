import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PlusIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { useState } from 'react'

export function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['teacher-students', searchTerm, filterRisk],
    queryFn: () => apiClient.getStudents({ search: searchTerm, riskLevel: filterRisk === 'all' ? undefined : filterRisk }),
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => apiClient.getTeacherDashboard(),
  })

  if (studentsLoading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading students</h3>
            <p className="mt-2 text-gray-600">Failed to fetch student data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const students = studentsData?.data || []
  const dashboard = dashboardData?.data || {}

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskDisplayName = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'Critical'
      case 'HIGH': return 'High'
      case 'MEDIUM': return 'Medium'
      case 'LOW': return 'Low'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600">Manage students in your class</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/students/register">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Register Student
            </Button>
          </Link>
          <div className="text-sm text-gray-500">
            {students.length} students
          </div>
        </div>
      </div>

      {/* Class Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.atRiskStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.attendanceRate || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interventions</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalInterventions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="input"
              >
                <option value="all">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No students found</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || filterRisk !== 'all' 
                ? 'No students match your search criteria.' 
                : 'No students have been registered in your class yet.'}
            </p>
            <Link to="/students/register" className="mt-4 inline-block">
              <Button>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Register First Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {students.map((student, index) => (
            <Card key={student._id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {student.gender}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          Age: {student.age}
                        </Badge>
                        <Badge className={getRiskColor(student.riskLevel)}>
                          {getRiskDisplayName(student.riskLevel)} Risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/students/${student._id}`}>
                      <Button size="sm" variant="outline">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Class Information</h4>
                      <div className="text-sm text-gray-600">
                        <p>Class: {student.classroomId || 'Not assigned'}</p>
                        <p>School: {student.schoolName}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Guardian Contacts</h4>
                      <div className="text-sm text-gray-600">
                        {student.guardianContacts && student.guardianContacts.length > 0 ? (
                          student.guardianContacts.map((guardian: any, idx: number) => (
                            <p key={idx}>
                              {guardian.name} ({guardian.relation})
                              {guardian.phone && ` - ${guardian.phone}`}
                            </p>
                          ))
                        ) : (
                          <p>No guardian contacts</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {student.socioEconomic && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Socio-Economic Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Ubudehe Level:</span>
                          <p className="font-medium">{student.socioEconomic.ubudeheLevel || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Parents:</span>
                          <p className="font-medium">{student.socioEconomic.hasParents ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Siblings:</span>
                          <p className="font-medium">{student.socioEconomic.numberOfSiblings || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Conflict:</span>
                          <p className="font-medium">{student.socioEconomic.familyConflict ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <Link to={`/students/${student._id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                      <div className="text-sm text-gray-500">
                        Last updated: {new Date(student.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}