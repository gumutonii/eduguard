import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  UsersIcon, 
  ExclamationTriangleIcon, 
  ClipboardDocumentCheckIcon, 
  ChartBarIcon,
  BellIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import type { 
  DashboardStats, 
  AtRiskOverview, 
  AttendanceTrend, 
  PerformanceTrend, 
  InterventionPipeline,
  Student,
  RiskFlag,
  Intervention
} from '@/types'

export function TeacherDashboardPage() {
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => apiClient.getTeacherClasses(),
  })

  const { data: atRiskStudents, isLoading: atRiskLoading } = useQuery({
    queryKey: ['teacher-at-risk-students'],
    queryFn: () => apiClient.getTeacherAtRiskStudents(),
  })

  const { data: lowScoreAlerts, isLoading: lowScoreLoading } = useQuery({
    queryKey: ['teacher-low-score-alerts'],
    queryFn: () => apiClient.getTeacherLowScoreAlerts(),
  })

  const { data: interventions, isLoading: interventionsLoading } = useQuery({
    queryKey: ['teacher-interventions'],
    queryFn: () => apiClient.getTeacherInterventions(),
  })

  const isLoading = classesLoading || atRiskLoading || lowScoreLoading || interventionsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Teacher Dashboard</h1>
          <p className="text-sm sm:text-base text-neutral-600">Monitor Your Students And Manage Your Classes</p>
        </div>
        <Link to="/students" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto">
            <UsersIcon className="h-4 w-4 mr-2" />
            View Students
          </Button>
        </Link>
      </div>

      {/* Today's Classes - Take Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Today's Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes?.data?.map((classItem: any) => (
              <div key={classItem.id} className="p-4 border border-neutral-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-neutral-900">{classItem.name}</h3>
                  <Badge variant="info">{classItem.time}</Badge>
                </div>
                <p className="text-sm text-neutral-600 mb-3">{classItem.studentCount} students</p>
                <Link to={`/students?tab=attendance&class=${classItem.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                    Take Attendance
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            My At-Risk Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {atRiskStudents?.data?.slice(0, 5).map((student: any) => (
              <div 
                key={student._id} 
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                onClick={() => window.location.href = `/students/${student._id}?tab=risk`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-neutral-600">{student.classroomId} • {student.reason}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={student.riskLevel.toLowerCase()}>
                    {student.riskLevel}
                  </Badge>
                  <Link to={`/students/${student._id}?tab=risk`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/students?tab=risk">
              <Button variant="outline" className="w-full">
                View All At-Risk Students
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Low-Score Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-yellow-600" />
            Low-Score Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowScoreAlerts?.data?.slice(0, 5).map((alert: any) => (
              <div 
                key={alert._id} 
                className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-xl hover:bg-yellow-100 cursor-pointer transition-colors"
                onClick={() => window.location.href = `/students/${alert.student._id}?tab=performance`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-yellow-600">
                      {alert.student.firstName.charAt(0)}{alert.student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{alert.student.firstName} {alert.student.lastName}</p>
                    <p className="text-sm text-neutral-600">{alert.subject} • Score: {alert.score}%</p>
                  </div>
                </div>
                <Link to={`/students/${alert.student._id}?tab=performance`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/students?tab=performance&filter=low">
              <Button variant="outline" className="w-full">
                View All Low Scores
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* My Interventions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-purple-600" />
            My Interventions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {interventions?.data?.slice(0, 5).map((intervention: any) => (
              <div 
                key={intervention._id} 
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                onClick={() => window.location.href = `/students/${intervention.student._id}?tab=interventions`}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {intervention.student.firstName.charAt(0)}{intervention.student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{intervention.title}</p>
                    <p className="text-sm text-neutral-600">{intervention.student.firstName} {intervention.student.lastName}</p>
                    <p className="text-xs text-neutral-500">
                      Due: {new Date(intervention.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={intervention.status === 'PLANNED' ? 'warning' : intervention.status === 'DONE' ? 'success' : 'error'}>
                    {intervention.status}
                  </Badge>
                  <Link to={`/students/${intervention.student._id}?tab=interventions`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/students?tab=interventions">
              <Button variant="outline" className="w-full">
                View All Interventions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
