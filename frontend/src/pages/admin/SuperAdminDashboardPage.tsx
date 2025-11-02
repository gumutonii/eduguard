import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, Treemap, FunnelChart, Funnel, LabelList, Legend
} from 'recharts'
import { apiClient } from '@/lib/api'

export function SuperAdminDashboardPage() {
  // System-wide analytics
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => apiClient.getSystemStats(),
  })

  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => apiClient.getAllSchools(),
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => apiClient.getAllUsers(),
  })

  const { data: riskSummary, isLoading: riskLoading } = useQuery({
    queryKey: ['system-risk-summary'],
    queryFn: () => apiClient.getSystemRiskSummary(),
  })

  const isLoading = statsLoading || schoolsLoading || usersLoading || riskLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = systemStats?.data || {} as any
  const schools = schoolsData?.data || []
  const users = usersData?.data || []
  const riskData = riskSummary?.data || {} as any

  // Calculate system-wide metrics
  const totalSchools = stats.totalSchools || schools.length
  const totalUsers = stats.totalUsers || users.length
  const totalStudents = stats.totalStudents || 0
  const totalClasses = stats.totalClasses || 0
  const totalAtRisk = stats.atRiskStudents || riskData.totalAtRisk || 0
  const pendingApprovals = stats.pendingApprovals || users.filter(user => !user.isApproved).length
  const activeUsers = stats.activeUsers || 0

  // School performance data
  const schoolPerformance = schools.map(school => ({
    name: school.name,
    students: school.studentCount || 0,
    atRisk: school.atRiskCount || 0,
    riskRate: school.studentCount > 0 ? ((school.atRiskCount || 0) / school.studentCount * 100).toFixed(1) : 0
  }))

  // User role distribution
  const roleDistribution = [
    { name: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#3B82F6' },
    { name: 'Teachers', value: users.filter(u => u.role === 'TEACHER').length, color: '#10B981' },
    { name: 'Pending', value: pendingApprovals, color: '#F59E0B' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-600">EduGuard platform-wide analytics and management</p>
        </div>
        <div className="flex gap-3">
          <Link to="/schools">
            <Button>
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Manage Schools
            </Button>
          </Link>
          <Link to="/approvals">
            <Button>
              <UserGroupIcon className="h-4 w-4 mr-2" />
              User Approvals
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/schools">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Schools</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSchools}</p>
                  <p className="text-xs text-gray-400">Active institutions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  <p className="text-xs text-gray-400">{activeUsers} active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-400">{totalClasses} classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students?riskLevel=HIGH">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">At Risk Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAtRisk}</p>
                  <p className="text-xs text-gray-400">
                    {totalStudents > 0 ? Math.round((totalAtRisk / totalStudents) * 100) : 0}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.attendance?.rate || 0}%</p>
                  <p className="text-xs text-gray-400">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Avg Performance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.performance?.averageScore || 0}%</p>
                  <p className="text-xs text-gray-400">{stats.performance?.passingRate || 0}% passing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <BellIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Active Interventions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.interventions?.inProgress || 0}</p>
                  <p className="text-xs text-gray-400">{stats.interventions?.total || 0} total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/approvals">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingApprovals}</p>
                  <p className="text-xs text-gray-400">Awaiting review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
            System Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.riskFlags?.critical || 0}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.riskFlags?.high || 0}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.riskFlags?.medium || 0}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.riskFlags?.low || 0}</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.riskFlags?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Active</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">By Type</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.attendance || 0}</div>
                <div className="text-xs text-gray-600">Attendance</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.performance || 0}</div>
                <div className="text-xs text-gray-600">Performance</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.behavior || 0}</div>
                <div className="text-xs text-gray-600">Behavior</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.socioeconomic || 0}</div>
                <div className="text-xs text-gray-600">Socioeconomic</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.combined || 0}</div>
                <div className="text-xs text-gray-600">Combined</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-gray-900">{riskData.byType?.other || 0}</div>
                <div className="text-xs text-gray-600">Other</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
              School Performance Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.performanceTrend || [
                  { month: 'Jan', totalStudents: 1200, atRisk: 45, attendance: 95 },
                  { month: 'Feb', totalStudents: 1250, atRisk: 52, attendance: 93 },
                  { month: 'Mar', totalStudents: 1300, atRisk: 48, attendance: 96 },
                  { month: 'Apr', totalStudents: 1280, atRisk: 41, attendance: 94 },
                  { month: 'May', totalStudents: 1320, atRisk: 38, attendance: 97 },
                  { month: 'Jun', totalStudents: 1350, atRisk: 35, attendance: 98 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="totalStudents" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Total Students" />
                  <Area type="monotone" dataKey="atRisk" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="At Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              Risk Analysis by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.riskAnalysis || [
                  { category: 'Academic', value: 75, fullMark: 100 },
                  { category: 'Attendance', value: 60, fullMark: 100 },
                  { category: 'Behavioral', value: 45, fullMark: 100 },
                  { category: 'Social', value: 80, fullMark: 100 },
                  { category: 'Health', value: 90, fullMark: 100 },
                  { category: 'Family', value: 55, fullMark: 100 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Risk Level" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>School Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.schoolPerformance || schoolPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalStudents" fill="#3B82F6" name="Total Students" />
                  <Bar dataKey="atRiskStudents" fill="#EF4444" name="At Risk" />
                  <Bar dataKey="attendanceRate" fill="#10B981" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-green-600" />
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.attendanceTrend || [
                  { week: 'W1', attendance: 95, target: 90 },
                  { week: 'W2', attendance: 93, target: 90 },
                  { week: 'W3', attendance: 96, target: 90 },
                  { week: 'W4', attendance: 94, target: 90 },
                  { week: 'W5', attendance: 97, target: 90 },
                  { week: 'W6', attendance: 98, target: 90 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={3} name="Actual" />
                  <Line type="monotone" dataKey="target" stroke="#6B7280" strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Funnel
                    dataKey="value"
                    data={stats.performanceFunnel || [
                      { name: 'Total Students', value: 1000, fill: '#3B82F6' },
                      { name: 'Regular Attendees', value: 850, fill: '#10B981' },
                      { name: 'Good Performance', value: 720, fill: '#F59E0B' },
                      { name: 'Excellent Performance', value: 480, fill: '#8B5CF6' }
                    ]}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" fontSize="12" />
                  </Funnel>
                  <Tooltip />
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.geographicDistribution || [
                  { district: 'Kigali', schools: 15, students: 4500 },
                  { district: 'Musanze', schools: 8, students: 2400 },
                  { district: 'Huye', schools: 6, students: 1800 },
                  { district: 'Rubavu', schools: 5, students: 1500 },
                  { district: 'Nyagatare', schools: 4, students: 1200 }
                ]} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="district" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="schools" fill="#3B82F6" name="Schools" />
                  <Bar dataKey="students" fill="#10B981" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messaging Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-purple-600" />
            Parent Communication (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.messages?.total || 0}</div>
              <div className="text-sm text-gray-600">Total Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.messages?.delivered || 0}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.messages?.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.messages?.failed || 0}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.messages?.total > 0 ? Math.round(((stats.messages?.delivered || 0) / stats.messages?.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <CardTitle>Schools Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    At Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{school.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{school.district}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{school.studentCount || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{school.atRiskCount || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={school.riskRate > 20 ? 'error' : school.riskRate > 10 ? 'warning' : 'low'}>
                        {school.riskRate || 0}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/schools/${school._id}`}>
                        <Button size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingApprovals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-yellow-600" />
              Pending Approvals ({pendingApprovals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                You have {pendingApprovals} user(s) waiting for approval. 
                <Link to="/admin/approvals" className="text-yellow-600 hover:text-yellow-500 ml-1">
                  Review and approve users →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
