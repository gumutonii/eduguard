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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { apiClient } from '@/lib/api'
import type { 
  DashboardStats, 
  AtRiskOverview, 
  AttendanceTrend, 
  PerformanceTrend, 
  InterventionPipeline 
} from '@/types'

export function DashboardPage() {
  // Use comprehensive dashboard endpoint
  const { data: dashboardReport, isLoading } = useQuery({
    queryKey: ['dashboard-report'],
    queryFn: () => apiClient.getDashboardReport(),
  })

  const { data: interventionSummary, isLoading: interventionLoading } = useQuery({
    queryKey: ['intervention-summary'],
    queryFn: () => apiClient.getInterventionSummary(),
  })

  const { data: riskSummary, isLoading: riskLoading } = useQuery({
    queryKey: ['risk-summary'],
    queryFn: () => apiClient.getRiskSummary(),
  })

  const loading = isLoading || interventionLoading || riskLoading

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

  const report = dashboardReport?.data
  const students = report?.students || {}
  const risks = riskSummary?.data || report?.risks || {}
  const interventions = interventionSummary?.data || report?.interventions || {}
  const attendance = report?.attendance || {}
  const messages = report?.messages || {}

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
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-neutral-600">Monitor Student Progress And Identify At-Risk Students</p>
        </div>
        <div className="flex gap-2">
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
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Students</p>
                  <p className="text-3xl font-bold text-neutral-900">{students.total || 0}</p>
                </div>
                <UsersIcon className="h-12 w-12 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?riskLevel=HIGH">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">High Risk</p>
                  <p className="text-3xl font-bold text-red-600">{students.highRisk || 0}</p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-green-600">{attendance.rate || 0}%</p>
                </div>
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Active Interventions</p>
                  <p className="text-3xl font-bold text-purple-600">{interventions.inProgress || 0}</p>
                </div>
                <BellIcon className="h-12 w-12 text-purple-500 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <BellIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Interventions</span>
              </Button>
            </Link>
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <ChartBarIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Reports</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
