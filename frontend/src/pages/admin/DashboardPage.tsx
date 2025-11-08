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
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { apiClient } from '@/lib/api'
import type { 
  DashboardStats, 
  AtRiskOverview, 
  AttendanceTrend, 
  PerformanceTrend, 
  InterventionPipeline 
} from '@/types'

export function DashboardPage() {
  // Use school admin dashboard endpoint
  const { data: schoolAdminStats, isLoading } = useQuery({
    queryKey: ['school-admin-stats'],
    queryFn: () => apiClient.getSchoolAdminStats(),
  })

  const loading = isLoading

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  const stats = schoolAdminStats?.data || {} as any
  const school = stats.school || {}
  const students = {
    total: stats.totalStudents || 0,
    highRisk: stats.atRiskStudents || 0
  }
  const risks = stats.riskFlags || {}
  const interventions = stats.interventions || {}
  const attendance = stats.attendance || {}
  const messages = stats.messages || {}
  const performance = stats.performance || {}
  const teachers = stats.teachers || []
  const classPerformance = stats.classPerformance || []

  const COLORS = {
    high: '#ef4444',
    medium: '#f59e0b', 
    low: '#10b981',
    primary: '#3b82f6',
    accent: '#8b5cf6'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">School Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            {school.name} • {school.district}, {school.sector}
          </p>
          <p className="text-sm text-neutral-500">Monitor teachers, students, and school activities</p>
        </div>
        <div className="flex gap-2">
          <Link to="/teachers" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <UsersIcon className="h-4 w-4 mr-2" />
              Manage Teachers
            </Button>
          </Link>
          <Link to="/students" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              <UsersIcon className="h-4 w-4 mr-2" />
              View Students
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Total Students</p>
                  <p className="text-3xl font-bold text-neutral-900">{students.total || 0}</p>
                  <p className="text-xs text-neutral-500">{stats.totalClasses || 0} classes</p>
                </div>
                <UsersIcon className="h-12 w-12 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/teachers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalTeachers || 0}</p>
                  <p className="text-xs text-neutral-500">{stats.pendingTeachers || 0} pending</p>
                </div>
                <UsersIcon className="h-12 w-12 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?riskLevel=HIGH">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">At Risk Students</p>
                  <p className="text-3xl font-bold text-red-600">{students.highRisk || 0}</p>
                  <p className="text-xs text-neutral-500">
                    {students.total > 0 ? Math.round((students.highRisk / students.total) * 100) : 0}% of total
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{attendance.rate || 0}%</p>
                  <p className="text-xs text-neutral-500">Last 30 days</p>
                </div>
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
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
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Active Interventions</p>
                  <p className="text-3xl font-bold text-orange-600">{interventions.inProgress || 0}</p>
                  <p className="text-xs text-neutral-500">{interventions.total || 0} total</p>
                </div>
                <BellIcon className="h-12 w-12 text-orange-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/notifications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Messages Sent</p>
                  <p className="text-3xl font-bold text-indigo-600">{messages.total || 0}</p>
                  <p className="text-xs text-neutral-500">{messages.delivered || 0} delivered</p>
                </div>
                <BellIcon className="h-12 w-12 text-indigo-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/classes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Total Classes</p>
                  <p className="text-3xl font-bold text-teal-600">{stats.totalClasses || 0}</p>
                  <p className="text-xs text-neutral-500">{stats.classesWithTeachers || 0} with teachers</p>
                </div>
                <UsersIcon className="h-12 w-12 text-teal-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Essential Charts - Right After Data Cards */}
      {classPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Class Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
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
      )}

      {/* Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            Risk Flags Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{risks.critical || 0}</div>
              <div className="text-sm text-neutral-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{risks.high || 0}</div>
              <div className="text-sm text-neutral-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{risks.medium || 0}</div>
              <div className="text-sm text-neutral-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{risks.low || 0}</div>
              <div className="text-sm text-neutral-600">Low</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{risks.total || 0}</div>
              <div className="text-sm text-neutral-600">Total Active</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium text-neutral-700 mb-2">By Type</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.attendance || 0}</div>
                <div className="text-xs text-neutral-600">Attendance</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.performance || 0}</div>
                <div className="text-xs text-neutral-600">Performance</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.behavior || 0}</div>
                <div className="text-xs text-neutral-600">Behavior</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.socioeconomic || 0}</div>
                <div className="text-xs text-neutral-600">Socioeconomic</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.combined || 0}</div>
                <div className="text-xs text-neutral-600">Combined</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 rounded">
                <div className="font-bold text-neutral-900">{risks.byType?.other || 0}</div>
                <div className="text-xs text-neutral-600">Other</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/students" className="flex-1">
              <Button variant="outline" className="w-full">
                Manage Risk Flags
              </Button>
            </Link>
            <Link to="/students?riskLevel=HIGH" className="flex-1">
              <Button variant="primary" className="w-full">
                View High Risk Students
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Attendance & Messages Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Attendance Summary (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Total Records</span>
                <span className="text-lg font-bold">{attendance.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Present</span>
                <span className="text-lg font-bold text-green-600">{attendance.present || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Absent</span>
                <span className="text-lg font-bold text-red-600">{attendance.absent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Attendance Rate</span>
                <span className="text-lg font-bold text-blue-600">{attendance.rate || 0}%</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/students">
                <Button variant="outline" className="w-full">
                  View Attendance Records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Message Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-purple-600" />
              Parent Messages (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Total Sent</span>
                <span className="text-lg font-bold">{messages.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Delivered</span>
                <span className="text-lg font-bold text-green-600">{messages.delivered || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Failed</span>
                <span className="text-lg font-bold text-red-600">{messages.failed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Pending</span>
                <span className="text-lg font-bold text-yellow-600">{messages.pending || 0}</span>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/notifications">
                <Button variant="outline" className="w-full">
                  View Message History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Intervention Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{interventions.planned || 0}</div>
              <div className="text-sm text-neutral-600">Planned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{interventions.inProgress || 0}</div>
              <div className="text-sm text-neutral-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{interventions.completed || 0}</div>
              <div className="text-sm text-neutral-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{interventions.overdue || 0}</div>
              <div className="text-sm text-neutral-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{interventions.total || 0}</div>
              <div className="text-sm text-neutral-600">Total</div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Link to="/students" className="flex-1">
              <Button variant="outline" className="w-full">
                Active Interventions
              </Button>
            </Link>
            <Link to="/students" className="flex-1">
              <Button variant="primary" className="w-full">
                All Interventions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Teacher Management</span>
            <Link to="/teachers">
              <Button size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                Manage All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pending Teachers */}
            {stats.pendingTeachers > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      {stats.pendingTeachers} Teacher(s) Pending Approval
                    </h4>
                    <p className="text-sm text-yellow-600">
                      Review and approve new teacher registrations
                    </p>
                  </div>
                  <Link to="/teachers?status=pending">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Teachers */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Teachers</h4>
              <div className="space-y-2">
                {teachers.slice(0, 5).map((teacher: any) => (
                  <div key={teacher._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {teacher.profilePicture ? (
                        <img
                          src={teacher.profilePicture}
                          alt={teacher.name}
                          className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                          <span className="text-sm font-medium text-blue-600">
                            {teacher.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        <p className="text-xs text-gray-400">{teacher.className}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={teacher.isApproved ? 'success' : 'warning'}>
                        {teacher.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                      <Link to={`/teachers/${teacher._id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Class Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classPerformance.length > 0 ? (
              classPerformance.map((classItem: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">{classItem.name}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{classItem.name}</p>
                      <p className="text-sm text-gray-500">
                        {classItem.totalStudents} students • {classItem.atRiskStudents} at risk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Risk Rate</p>
                      <p className="text-lg font-bold text-gray-900">
                        {classItem.totalStudents > 0 ? 
                          Math.round((classItem.atRiskStudents / classItem.totalStudents) * 100) : 0}%
                      </p>
                    </div>
                    <Badge variant={
                      classItem.totalStudents > 0 && (classItem.atRiskStudents / classItem.totalStudents) > 0.3 ? 'error' :
                      classItem.totalStudents > 0 && (classItem.atRiskStudents / classItem.totalStudents) > 0.1 ? 'warning' : 'low'
                    }>
                      {classItem.totalStudents > 0 && (classItem.atRiskStudents / classItem.totalStudents) > 0.3 ? 'High Risk' :
                       classItem.totalStudents > 0 && (classItem.atRiskStudents / classItem.totalStudents) > 0.1 ? 'Medium Risk' : 'Low Risk'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No class performance data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Link to="/teachers">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <UsersIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Teachers</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <UsersIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Students</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <ClipboardDocumentCheckIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Attendance</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <ChartBarIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Performance</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Risk Flags</span>
              </Button>
            </Link>
            <Link to="/notifications">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <BellIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Messages</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
