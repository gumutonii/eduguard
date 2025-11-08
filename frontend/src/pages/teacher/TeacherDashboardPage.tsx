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
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts'
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
  // Use comprehensive teacher dashboard endpoint
  const { data: teacherStats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => apiClient.getTeacherStats(),
  })

  const loading = isLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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

  const stats = teacherStats?.data || {} as any
  const teacher = stats.teacher || {}
  const classes = stats.classes || []
  const atRiskStudents = stats.atRiskStudents || []
  const lowScoreAlerts = stats.lowScoreAlerts || []
  const interventions = stats.interventions || {}
  const attendance = stats.attendance || {}
  const performance = stats.performance || {}
  const messages = stats.messages || {}
  const riskFlags = stats.riskFlags || {}
  
  // Debug logging
  console.log('🔍 Teacher Dashboard Data:', {
    totalStudents: stats.totalStudents,
    atRiskStudentsCount: stats.atRiskStudents?.length || 0,
    totalClasses: stats.totalClasses,
    attendance: attendance.rate,
    performance: performance.averageScore,
    interventions: interventions.total,
    messages: messages.total,
    riskFlags: riskFlags.total
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Teacher Dashboard</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {teacher.name} • {teacher.className}
          </p>
          <p className="text-sm text-neutral-500">{teacher.schoolName}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/students" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <UsersIcon className="h-4 w-4 mr-2" />
              View Students
            </Button>
          </Link>
          <Link to="/students" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
              Take Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Total Students</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.totalStudents || 0}</p>
                  <p className="text-xs text-neutral-500">{stats.totalClasses || 0} classes</p>
                </div>
                <UsersIcon className="h-12 w-12 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?riskLevel=HIGH">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">At Risk Students</p>
                  <p className="text-3xl font-bold text-red-600">{stats.atRiskStudents?.length || 0}</p>
                  <p className="text-xs text-neutral-500">
                    {stats.totalStudents > 0 ? Math.round(((stats.atRiskStudents?.length || 0) / stats.totalStudents) * 100) : 0}% of total
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600">{attendance.rate || 0}%</p>
                <p className="text-xs text-neutral-500">Last 30 days</p>
              </div>
              <ClipboardDocumentCheckIcon className="h-12 w-12 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="h-32">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Avg Performance</p>
                <p className="text-3xl font-bold text-purple-600">{performance.averageScore || 0}%</p>
                <p className="text-xs text-neutral-500">{performance.passingRate || 0}% passing</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-purple-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Interventions</p>
                <p className="text-3xl font-bold text-orange-600">{stats.interventions?.inProgress || 0}</p>
                <p className="text-xs text-neutral-500">{stats.interventions?.total || 0} total</p>
              </div>
              <BellIcon className="h-12 w-12 text-orange-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Messages Sent</p>
                <p className="text-3xl font-bold text-indigo-600">{messages.total || 0}</p>
                <p className="text-xs text-neutral-500">{messages.delivered || 0} delivered</p>
              </div>
              <BellIcon className="h-12 w-12 text-indigo-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Low Scores</p>
                <p className="text-3xl font-bold text-yellow-600">{lowScoreAlerts.length || 0}</p>
                <p className="text-xs text-neutral-500">Need attention</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Risk Flags</p>
                <p className="text-3xl font-bold text-red-600">{stats.riskFlags?.total || 0}</p>
                <p className="text-xs text-neutral-500">
                  {stats.riskFlags?.critical || 0} critical, {stats.riskFlags?.high || 0} high
                </p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Essential Charts - Right After Data Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-green-600" />
              Class Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classes.length > 0 ? classes.slice(0, 5).map((c: any) => ({
                  name: c.name,
                  totalStudents: c.studentCount,
                  atRiskStudents: c.atRiskCount || 0,
                  averageScore: c.averageScore || 75
                })) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalStudents" fill="#3B82F6" name="Total Students" />
                  <Bar dataKey="atRiskStudents" fill="#EF4444" name="At Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-green-600" />
              Weekly Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.attendanceTrend && stats.attendanceTrend.length > 0 ? stats.attendanceTrend : [
                  { week: 'W1', attendance: 0, target: 90 },
                  { week: 'W2', attendance: 0, target: 90 },
                  { week: 'W3', attendance: 0, target: 90 },
                  { week: 'W4', attendance: 0, target: 90 },
                  { week: 'W5', attendance: 0, target: 90 },
                  { week: 'W6', attendance: 0, target: 90 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis domain={[80, 100]} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="target" stroke="#6B7280" strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            My Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.length > 0 ? (
              classes.map((classItem: any) => (
                <div key={classItem._id} className="p-4 border border-neutral-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-neutral-900">{classItem.name}</h3>
                    <Badge variant="info">{classItem.studentCount} students</Badge>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">Class {classItem.name}</p>
                  <Link to={`/students?tab=attendance&class=${classItem._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                      Take Attendance
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No classes assigned yet</p>
              </div>
            )}
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
            {atRiskStudents.length > 0 ? (
              atRiskStudents.slice(0, 5).map((student: any) => (
                <div 
                  key={student._id} 
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/students/${student._id}?tab=risk`}
                >
                  <div className="flex items-center space-x-3">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-10 w-10 rounded-full object-cover border-2 border-red-200"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-200">
                        <span className="text-sm font-medium text-red-600">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{student.firstName} {student.lastName}</p>
                      <p className="text-sm text-neutral-600">{student.className} • {student.reason}</p>
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No at-risk students found</p>
              </div>
            )}
          </div>
          {atRiskStudents.length > 0 && (
            <div className="mt-4">
              <Link to="/students?tab=risk">
                <Button variant="outline" className="w-full">
                  View All At-Risk Students
                </Button>
              </Link>
            </div>
          )}
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
            {lowScoreAlerts.length > 0 ? (
              lowScoreAlerts.slice(0, 5).map((alert: any) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No low score alerts</p>
              </div>
            )}
          </div>
          {lowScoreAlerts.length > 0 && (
            <div className="mt-4">
              <Link to="/students?tab=performance&filter=low">
                <Button variant="outline" className="w-full">
                  View All Low Scores
                </Button>
              </Link>
            </div>
          )}
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
            {interventions.length > 0 ? (
              interventions.slice(0, 5).map((intervention: any) => (
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
                    <Badge variant={
                      intervention.status === 'PLANNED' ? 'warning' : 
                      intervention.status === 'COMPLETED' ? 'success' : 
                      intervention.status === 'IN_PROGRESS' ? 'info' : 'error'
                    }>
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No interventions assigned</p>
              </div>
            )}
          </div>
          {interventions.length > 0 && (
            <div className="mt-4">
              <Link to="/students?tab=interventions">
                <Button variant="outline" className="w-full">
                  View All Interventions
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
