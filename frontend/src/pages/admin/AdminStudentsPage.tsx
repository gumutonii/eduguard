import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { useState } from 'react'

export function AdminStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const queryClient = useQueryClient()

  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => apiClient.deleteStudent(studentId),
    onSuccess: () => {
      // Invalidate all related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] })
    }
  })

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['admin-students', searchTerm, filterRisk],
    queryFn: () => apiClient.getStudents({ search: searchTerm, riskLevel: filterRisk === 'all' ? undefined : filterRisk }),
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  if (studentsLoading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all students in your school</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          {students.length} total students
        </div>
      </div>

      {/* School Overview Cards */}
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
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalClasses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalTeachers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 sm:pl-10 min-h-[44px] text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="input min-h-[44px] text-sm sm:text-base flex-1 sm:flex-none sm:w-auto w-full"
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
                : 'No students have been registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {students.map((student, index) => (
            <Card key={student._id || index}>
              <CardHeader>
                  <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-12 w-12 rounded-full object-cover border-2 border-primary-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-primary-200">
                        <span className="text-sm font-medium text-blue-600">
                          {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
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
                      <Button size="sm" variant="outline" className="min-w-[44px] min-h-[44px]">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="min-w-[44px] min-h-[44px]">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}? This action cannot be undone.`)) {
                          deleteStudentMutation.mutate(student._id)
                        }
                      }}
                      disabled={deleteStudentMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[44px] min-h-[44px]"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Class Information</h4>
                      <div className="text-sm text-gray-600">
                        <p>Class: {student.classId?.className || student.className || 'Not assigned'}</p>
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
                          <span className="text-gray-500">Stability:</span>
                          <p className="font-medium">{student.socioEconomic.familyStability ? 'Yes (Stable)' : 'No (Less Stable)'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                      <Link to={`/students/${student._id}`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto min-h-[44px]">View Details</Button>
                      </Link>
                      <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
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
