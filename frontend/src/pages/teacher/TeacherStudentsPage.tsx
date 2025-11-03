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
  PlusIcon,
  UserPlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useState } from 'react'

export function TeacherStudentsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['teacher-students', searchTerm, filterRisk],
    queryFn: () => {
      console.log('🔍 Fetching students with params:', { search: searchTerm, riskLevel: filterRisk === 'all' ? undefined : filterRisk });
      return apiClient.getStudents({ search: searchTerm, riskLevel: filterRisk === 'all' ? undefined : filterRisk });
    },
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => apiClient.getTeacherDashboard(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    },
  })

  const handleDelete = async (studentId: string, studentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(studentId)
        alert('Student deleted successfully')
      } catch (error: any) {
        alert(error?.message || 'Failed to delete student. Please try again.')
        console.error('Delete error:', error)
      }
    }
  }

  const canDelete = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER'

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
    console.error('❌ Students fetch error:', studentsError);
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
            <p className="mt-2 text-sm text-red-600">Error: {studentsError instanceof Error ? studentsError.message : 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const students = studentsData?.data || []
  const dashboard = dashboardData?.data || {}
  
  console.log('📊 Students data:', studentsData);
  console.log('👥 Students array:', students);
  console.log('📈 Dashboard data:', dashboard);
  
  // Ensure students is always an array
  const studentsArray = Array.isArray(students) ? students : []

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
            {studentsArray.length} students
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
            <div className="text-2xl font-bold">{studentsArray.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentsArray.filter(student => 
                student.riskLevel === 'HIGH' || 
                student.riskLevel === 'CRITICAL' || 
                student.riskLevel === 'MEDIUM'
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.attendance?.rate || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interventions</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.interventions?.total || 0}</div>
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
      {studentsArray.length === 0 ? (
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsArray.map((student, index) => (
                  <tr key={student._id || index} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          {student.guardianContacts && student.guardianContacts.length > 0 && student.guardianContacts[0]?.name && (
                            <div className="text-sm text-gray-500">
                              {student.guardianContacts[0].name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-blue-100 text-blue-800">
                        {student.gender || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.age || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.classId?.className || student.className || student.classroomId || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getRiskColor(student.riskLevel)}>
                        {getRiskDisplayName(student.riskLevel)} Risk
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link to={`/students/${student._id}`}>
                          <Button size="sm" variant="outline">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDelete(student._id, `${student.firstName} ${student.lastName}`, e)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteMutation.isPending}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}