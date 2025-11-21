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
  BarChart, Bar, Legend, ComposedChart
} from 'recharts'
import { apiClient } from '@/lib/api'

export function SuperAdminDashboardPage() {
  // System-wide analytics with real-time updates
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => apiClient.getSystemStats(),
    staleTime: 30000, // 30 seconds - data is fresh for 30 seconds
    gcTime: 300000, // 5 minutes - keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus for real-time updates
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
    refetchInterval: 60000, // Auto-refetch every 60 seconds for real-time dashboard updates
  })

  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => apiClient.getAllSchools(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Real-time updates
    refetchOnMount: true,
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => apiClient.getAllUsers(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Real-time updates
    refetchOnMount: true,
  })

  const { data: riskSummary, isLoading: riskLoading } = useQuery({
    queryKey: ['system-risk-summary'],
    queryFn: () => apiClient.getSystemRiskSummary(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Real-time updates
    refetchOnMount: true,
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

  // Helper function to abbreviate school names intelligently
  const abbreviateSchoolName = (name: string): string => {
    if (!name) return ''
    
    let abbreviated = name.trim()
    
    // Handle common Rwandan school name patterns
    // Pattern 1: "Ecole Primaire et Secondaire de [Location]" -> "EPS [Location]"
    if (/^Ecole\s+Primaire\s+et\s+Secondaire\s+de\s+/i.test(abbreviated)) {
      abbreviated = abbreviated.replace(/^Ecole\s+Primaire\s+et\s+Secondaire\s+de\s+/i, 'EPS ')
    }
    // Pattern 2: "Ecole Primaire de [Location]" -> "EP [Location]"
    else if (/^Ecole\s+Primaire\s+de\s+/i.test(abbreviated)) {
      abbreviated = abbreviated.replace(/^Ecole\s+Primaire\s+de\s+/i, 'EP ')
    }
    // Pattern 3: "Ecole Secondaire de [Location]" -> "ES [Location]"
    else if (/^Ecole\s+Secondaire\s+de\s+/i.test(abbreviated)) {
      abbreviated = abbreviated.replace(/^Ecole\s+Secondaire\s+de\s+/i, 'ES ')
    }
    // Pattern 4: "Secondaire de [Location]" -> "S [Location]"
    else if (/^Secondaire\s+de\s+/i.test(abbreviated)) {
      abbreviated = abbreviated.replace(/^Secondaire\s+de\s+/i, 'S ')
    }
    // Pattern 5: "[Name] SS" or "[Name] Secondary School" -> Keep as is
    else if (/\s+SS$/i.test(abbreviated) || /\s+Secondary\s+School$/i.test(abbreviated)) {
      // Already abbreviated, just clean up
      abbreviated = abbreviated.replace(/\s+Secondary\s+School$/i, ' SS')
    }
    // Pattern 6: Remove standalone "Ecole" prefix
    else if (/^Ecole\s+/i.test(abbreviated)) {
      abbreviated = abbreviated.replace(/^Ecole\s+/i, '')
    }
    
    // If still too long (more than 18 chars), intelligently truncate
    if (abbreviated.length > 18) {
      const words = abbreviated.split(/\s+/)
      if (words.length >= 2) {
        // Take first word (usually abbreviation) + location (last word or two)
        if (words[0].length <= 5) {
          // First word is short (like "EPS", "EP", "ES"), take it + location
          abbreviated = words[0] + ' ' + words.slice(-1).join(' ')
        } else {
          // Take first 2 words
          abbreviated = words.slice(0, 2).join(' ')
        }
      }
      
      // Final check: if still too long, truncate with ellipsis
      if (abbreviated.length > 18) {
        abbreviated = abbreviated.substring(0, 15) + '...'
      }
    }
    
    return abbreviated
  }

  // School performance data with abbreviated names for display
  const schoolPerformance = schools.map(school => ({
    name: school.name, // Full name for tooltip
    abbreviatedName: abbreviateSchoolName(school.name), // Abbreviated for X-axis
    students: school.studentCount || 0,
    atRisk: school.atRiskCount || 0,
    totalStudents: school.studentCount || 0,
    atRiskStudents: school.atRiskCount || 0,
    riskRate: school.studentCount > 0 ? ((school.atRiskCount || 0) / school.studentCount * 100).toFixed(1) : 0
  }))

  // Process backend school performance data to add abbreviated names
  const processedSchoolPerformance = (stats.schoolPerformance || []).map((school: any) => ({
    ...school,
    abbreviatedName: abbreviateSchoolName(school.name || ''),
    totalStudents: school.totalStudents || school.students || 0,
    atRiskStudents: school.atRiskStudents || school.atRisk || 0,
    riskRate: school.riskRate || (school.totalStudents > 0 
      ? Math.round((school.atRiskStudents / school.totalStudents) * 100 * 10) / 10 
      : 0)
  }))

  // Merge school data with performance data for the table
  // Use schoolPerformance from backend (has real student counts) as primary source
  const schoolsForTable = (stats.schoolPerformance || []).map((schoolPerf: any) => {
    // Find matching school from schoolsData for additional info
    const schoolInfo = schools.find((s: any) => s._id === schoolPerf._id || s.name === schoolPerf.name)
    return {
      _id: schoolPerf._id || schoolInfo?._id,
      name: schoolPerf.name || schoolInfo?.name,
      district: schoolPerf.district || schoolInfo?.district,
      sector: schoolPerf.sector || schoolInfo?.sector,
      totalStudents: schoolPerf.totalStudents || schoolPerf.students || 0,
      atRiskStudents: schoolPerf.atRiskStudents || schoolPerf.atRisk || 0,
      studentCount: schoolPerf.totalStudents || schoolPerf.students || 0,
      atRiskCount: schoolPerf.atRiskStudents || schoolPerf.atRisk || 0,
      riskRate: schoolPerf.riskRate || (schoolPerf.totalStudents > 0 
        ? Math.round((schoolPerf.atRiskStudents / schoolPerf.totalStudents) * 100 * 10) / 10 
        : 0)
    }
  })

  // If no schoolPerformance data, fall back to schools data
  const displaySchools = schoolsForTable.length > 0 ? schoolsForTable : schools.map((school: any) => ({
    ...school,
    totalStudents: school.studentCount || 0,
    atRiskStudents: school.atRiskCount || 0,
    riskRate: school.riskRate || (school.studentCount > 0 
      ? Math.round((school.atRiskCount / school.studentCount) * 100 * 10) / 10 
      : 0)
  }))

  // User role distribution
  const roleDistribution = [
    { name: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#3B82F6' },
    { name: 'Teachers', value: users.filter(u => u.role === 'TEACHER').length, color: '#10B981' },
    { name: 'Pending', value: pendingApprovals, color: '#F59E0B' }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">System Overview</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">EduGuard platform-wide analytics and management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link to="/schools" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Manage Schools</span>
              <span className="sm:hidden">Schools</span>
            </Button>
          </Link>
          <Link to="/approvals" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Approvals</span>
              <span className="sm:hidden">Approvals</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
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

      {/* Essential Charts - Right After Data Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6">
        {/* School Students Overview - Total and At Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
              School Students Overview
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Total and At Risk students per school
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 lg:h-96">
              {(processedSchoolPerformance.length > 0) || schoolPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={(processedSchoolPerformance.slice(0, 8) || schoolPerformance.slice(0, 8))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="abbreviatedName" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    fontSize={11}
                    interval={0}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '2px solid #3B82F6',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      padding: '12px 16px'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    formatter={(value: any, name: string) => {
                      return [
                        <span key={name} style={{ fontWeight: 600, color: name === 'Total Students' ? '#3B82F6' : '#EF4444' }}>
                          {value} students
                        </span>,
                        name
                      ]
                    }}
                    labelFormatter={(label: string, payload: any) => {
                      const fullName = payload?.[0]?.payload?.name || label
                      const abbreviatedName = payload?.[0]?.payload?.abbreviatedName || label
                      return (
                        <div style={{ 
                          fontWeight: 700, 
                          marginBottom: '8px', 
                          color: '#111827',
                          fontSize: '14px',
                          borderBottom: '2px solid #E5E7EB',
                          paddingBottom: '6px'
                        }}>
                          <div style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                            Full School Name:
                          </div>
                          <div>{fullName}</div>
                          {abbreviatedName !== fullName && (
                            <div style={{ 
                              color: '#6B7280', 
                              fontSize: '11px', 
                              fontWeight: 400, 
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              (Shown as: {abbreviatedName})
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar 
                    dataKey="totalStudents" 
                    fill="#3B82F6" 
                    name="Total Students"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="atRiskStudents" 
                    fill="#EF4444" 
                    name="At Risk Students"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No school data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Combined Attendance & Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-green-600" />
              Attendance & Performance Trend
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Last 6 weeks - Real-time data</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 lg:h-96">
              {(stats.combinedTrend && stats.combinedTrend.length > 0) || (stats.attendanceTrend && stats.performanceTrend) ? (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={stats.combinedTrend || stats.attendanceTrend?.map((att: any, index: number) => ({
                      week: att.week,
                      attendance: att.attendance,
                      performance: stats.performanceTrend?.[index]?.performance || 0,
                      attendanceTarget: att.target,
                      performanceTarget: 70
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="week" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]}
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    label={{ value: 'Attendance (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                    label={{ value: 'Performance (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Attendance (%)"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="attendanceTarget" 
                    stroke="#6B7280" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Attendance Target"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="performance" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Performance (%)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="performanceTarget" 
                    stroke="#9CA3AF" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Performance Target"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No trend data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
        </CardContent>
      </Card>

      {/* Messaging Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2 text-purple-600" />
            Parent Communication (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      At Risk
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Rate
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displaySchools.length > 0 ? (
                    displaySchools.map((school) => (
                      <tr key={school._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{school.name || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{school.district || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{school.totalStudents || school.studentCount || 0}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{school.atRiskStudents || school.atRiskCount || 0}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            (school.riskRate || 0) > 20 ? 'error' : 
                            (school.riskRate || 0) > 10 ? 'warning' : 'low'
                          }>
                            {school.riskRate?.toFixed(1) || '0.0'}%
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {school._id && (
                        <Link to={`/schools/${school._id}`}>
                          <Button size="sm" className="min-h-[44px]">View</Button>
                        </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                        <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No schools found. Data will appear here once schools are registered.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
              Recent Users ({users.length})
            </span>
            <Link to="/users">
              <Button size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.slice(0, 10).map((user: any) => (
              <div 
                key={user._id} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => window.location.href = `/users/${user._id}`}
              >
                <div className="flex items-center space-x-3">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                      <span className="text-sm font-medium text-primary-600">
                        {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                       user.role === 'ADMIN' ? 'Admin' : 'Teacher'} • {user.schoolName || 'No School'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 
                                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                                    'bg-blue-100 text-blue-800'}>
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                     user.role === 'ADMIN' ? 'Admin' : 'Teacher'}
                  </Badge>
                  <Badge variant={user.isApproved ? 'success' : 'warning'}>
                    {user.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
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
