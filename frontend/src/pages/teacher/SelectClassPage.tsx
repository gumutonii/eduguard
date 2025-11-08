import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

export function SelectClassPage() {
  const { data: teacherStats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => apiClient.getTeacherStats(),
  })

  const classes = teacherStats?.data?.classes || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Select Class</h1>
        <p className="text-gray-600">Choose a class to record attendance and performance</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No classes assigned</h3>
            <p className="mt-2 text-gray-600">You don't have any classes assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem: any) => (
            <Card key={classItem._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-5 w-5 text-primary-600" />
                    <span>{classItem.name}</span>
                  </div>
                  <Badge variant="info">{classItem.studentCount || 0} students</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>At Risk Students:</span>
                    <Badge variant={classItem.atRiskCount > 0 ? 'error' : 'success'}>
                      {classItem.atRiskCount || 0}
                    </Badge>
                  </div>
                  {classItem.averageScore !== undefined && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Average Score:</span>
                      <span className="font-medium">{classItem.averageScore}%</span>
                    </div>
                  )}
                  <Link to={`/classes/${classItem._id}/attendance-performance`} className="block">
                    <Button variant="primary" className="w-full">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                      Attendance & Performance
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

