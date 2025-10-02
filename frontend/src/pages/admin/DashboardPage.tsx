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
import type { 
  DashboardStats, 
  AtRiskOverview, 
  AttendanceTrend, 
  PerformanceTrend, 
  InterventionPipeline 
} from '@/types'

// API client
const apiClient = {
  getDashboardStats: async () => {
    const response = await fetch('/api/dashboard/stats')
    return response.json()
  },
  getAtRiskOverview: async () => {
    const response = await fetch('/api/dashboard/at-risk-overview')
    return response.json()
  },
  getAttendanceTrend: async (days: number = 30) => {
    const response = await fetch(`/api/dashboard/attendance-trend?days=${days}`)
    return response.json()
  },
  getPerformanceTrend: async (days: number = 30) => {
    const response = await fetch(`/api/dashboard/performance-trend?days=${days}`)
    return response.json()
  },
  getInterventionPipeline: async () => {
    const response = await fetch('/api/dashboard/intervention-pipeline')
    return response.json()
  }
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  const { data: atRiskData, isLoading: atRiskLoading } = useQuery({
    queryKey: ['at-risk-overview'],
    queryFn: () => apiClient.getAtRiskOverview(),
  })

  const { data: attendanceTrend, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: () => apiClient.getAttendanceTrend(30),
  })

  const { data: performanceTrend, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance-trend'],
    queryFn: () => apiClient.getPerformanceTrend(30),
  })

  const { data: interventionData, isLoading: interventionLoading } = useQuery({
    queryKey: ['intervention-pipeline'],
    queryFn: () => apiClient.getInterventionPipeline(),
  })

  const isLoading = statsLoading || atRiskLoading || attendanceLoading || performanceLoading || interventionLoading

  if (isLoading) {
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

  const dashboardStats = stats?.data
  const atRiskOverview = atRiskData?.data
  const attendanceData = attendanceTrend?.data
  const performanceData = performanceTrend?.data
  const interventionPipeline = interventionData?.data

  const COLORS = {
    high: '#ef4444',
    medium: '#f59e0b', 
    low: '#10b981',
    primary: '#3b82f6',
    accent: '#8b5cf6'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Monitor student progress and identify at-risk students</p>
        </div>
        <Link to="/students">
          <Button variant="primary">
            <UsersIcon className="h-4 w-4 mr-2" />
            View Students
          </Button>
        </Link>
      </div>

      {/* At-Risk Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            At-Risk Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{atRiskOverview?.high || 0}</div>
              <div className="text-sm text-neutral-600">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{atRiskOverview?.medium || 0}</div>
              <div className="text-sm text-neutral-600">Medium Risk</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{atRiskOverview?.low || 0}</div>
              <div className="text-sm text-neutral-600">Low Risk</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900">{atRiskOverview?.total || 0}</div>
              <div className="text-sm text-neutral-600">Total At-Risk</div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/students?risk=high">
              <Button variant="outline" className="w-full">
                View High Risk Students
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Attendance Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke={COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <Link to="/students?tab=attendance">
                <Button variant="outline" className="w-full">
                  View Attendance Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
              Performance Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke={COLORS.accent} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <Link to="/students?tab=performance">
                <Button variant="outline" className="w-full">
                  View Performance Details
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
            <BellIcon className="h-5 w-5 mr-2 text-purple-600" />
            Intervention Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{interventionPipeline?.planned || 0}</div>
              <div className="text-sm text-neutral-600">Planned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{interventionPipeline?.inProgress || 0}</div>
              <div className="text-sm text-neutral-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{interventionPipeline?.completed || 0}</div>
              <div className="text-sm text-neutral-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900">{interventionPipeline?.total || 0}</div>
              <div className="text-sm text-neutral-600">Total</div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/students?tab=interventions">
              <Button variant="outline" className="w-full">
                View Intervention Details
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/students">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <UsersIcon className="h-6 w-6 mb-2" />
                View Students
              </Button>
            </Link>
            <Link to="/students?tab=attendance">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <ClipboardDocumentCheckIcon className="h-6 w-6 mb-2" />
                Attendance
              </Button>
            </Link>
            <Link to="/students?tab=performance">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <ChartBarIcon className="h-6 w-6 mb-2" />
                Performance
              </Button>
            </Link>
            <Link to="/students?tab=interventions">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <BellIcon className="h-6 w-6 mb-2" />
                Interventions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
