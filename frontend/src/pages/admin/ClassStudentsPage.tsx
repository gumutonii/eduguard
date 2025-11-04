import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  AcademicCapIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

export function ClassStudentsPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const schoolId = searchParams.get('schoolId')

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => apiClient.getClass(id!),
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', id],
    queryFn: () => apiClient.getClassStudents(id!),
  })

  // Determine back link based on schoolId parameter
  const backLink = schoolId ? `/schools/${schoolId}` : '/classes'
  const backText = schoolId ? 'Back to School' : 'Back to Classes'

  if (classLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={backLink}>
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                {backText}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const classInfo = classData?.data
  const students = studentsData?.data || []

  if (!classInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to={backLink}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Class not found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Class not found</h3>
            <p className="mt-2 text-gray-600">
              The class you are looking for does not exist or you do not have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      case 'CRITICAL': return 'Critical Risk'
      case 'HIGH': return 'High Risk'
      case 'MEDIUM': return 'Medium Risk'
      case 'LOW': return 'Low Risk'
      default: return 'No Risk'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={backLink}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classInfo?.className || classInfo?.fullName}</h1>
            <p className="text-gray-600">Students in this class</p>
          </div>
        </div>
      </div>

      {/* Class Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{students.length}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {students.filter((s: any) => s.riskLevel === 'LOW' || !s.riskLevel).length}
              </div>
              <div className="text-sm text-gray-500">Low Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {students.filter((s: any) => ['HIGH', 'CRITICAL'].includes(s.riskLevel)).length}
              </div>
              <div className="text-sm text-gray-500">At Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No students in this class</h3>
            <p className="mt-2 text-gray-600">
              Students will appear here once they are assigned to this class.
            </p>
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
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student: any, index: number) => (
                  <tr key={student._id || index} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getRiskColor(student.riskLevel)}>
                        {getRiskDisplayName(student.riskLevel)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/students/${student._id}`}>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
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
