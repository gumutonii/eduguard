import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { Link } from 'react-router-dom'

export function TeacherRiskFlagsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true')

  const { data: riskFlagsData, isLoading } = useQuery({
    queryKey: ['risk-flags', severityFilter, isActiveFilter],
    queryFn: () => {
      const params: any = {}
      if (severityFilter) params.severity = severityFilter
      if (isActiveFilter === 'true') params.isActive = true
      else if (isActiveFilter === 'false') params.isActive = false
      return apiClient.getRiskFlags(params)
    }
  })

  const riskFlags = riskFlagsData?.data || []

  // Organize risk flags by type
  const organizedFlags = {
    socioeconomic: riskFlags.filter((flag: any) => 
      flag.type === 'SOCIOECONOMIC' || flag.type === 'DISTANCE'
    ),
    attendance: riskFlags.filter((flag: any) => flag.type === 'ATTENDANCE'),
    performance: riskFlags.filter((flag: any) => flag.type === 'PERFORMANCE')
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'socioeconomic':
        return 'Socio-economic and family-based risk flags detected during student registration'
      case 'attendance':
        return 'Weekly attendance risk flags based on current week attendance records (5 days)'
      case 'performance':
        return 'Term-based performance risk flags based on overall term performance'
      default:
        return ''
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="error">CRITICAL</Badge>
      case 'HIGH':
        return <Badge variant="error">HIGH</Badge>
      case 'MEDIUM':
        return <Badge variant="warning">MEDIUM</Badge>
      case 'LOW':
        return <Badge variant="info">LOW</Badge>
      default:
        return <Badge variant="info">{severity}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ATTENDANCE: 'bg-blue-100 text-blue-800',
      PERFORMANCE: 'bg-purple-100 text-purple-800',
      SOCIOECONOMIC: 'bg-orange-100 text-orange-800',
      DISTANCE: 'bg-yellow-100 text-yellow-800',
      COMBINED: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-neutral-100 text-neutral-800'}`}>
        {type?.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Risk Flags</h1>
          <p className="text-sm sm:text-base text-neutral-600">View risk flags for your assigned students</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md min-h-[44px] text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Resolved</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Flags List - Organized by Type */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : riskFlags.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No risk flags found for your assigned students</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Socio-economic and Family-based Risk Flags */}
          {organizedFlags.socioeconomic.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                  Socio-economic & Family-based Risk Flags ({organizedFlags.socioeconomic.length})
                </CardTitle>
                <p className="text-sm text-neutral-600 mt-1">
                  {getTypeDescription('socioeconomic')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizedFlags.socioeconomic.map((flag: any) => (
                    <div
                      key={flag._id}
                      className={`p-4 border rounded-xl ${
                        flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                          ? 'bg-red-50 border-red-200'
                          : flag.severity === 'MEDIUM'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(flag.severity)}
                            {getTypeBadge(flag.type)}
                            {!flag.isActive && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <Link
                            to={`/students/${flag.studentId?._id || flag.studentId}`}
                            className="block"
                          >
                            <h3 className="font-medium text-neutral-900 hover:text-primary-600 mb-1">
                              {flag.title || `${flag.studentId?.firstName} ${flag.studentId?.lastName}`}
                            </h3>
                          </Link>
                          <p className="text-sm text-neutral-700 mb-2">
                            <strong>Student:</strong>{' '}
                            <Link
                              to={`/students/${flag.studentId?._id || flag.studentId}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {flag.studentId?.firstName} {flag.studentId?.lastName}
                            </Link>
                          </p>
                          <p className="text-sm text-neutral-700 line-clamp-2">
                            {flag.description || flag.reason || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                            <span>
                              Created: {new Date(flag.createdAt).toLocaleDateString()}
                            </span>
                            {flag.createdBy?.name && (
                              <span>By: {flag.createdBy.name}</span>
                            )}
                            {flag.resolvedAt && (
                              <span>
                                Resolved: {new Date(flag.resolvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link to={`/students/${flag.studentId?._id || flag.studentId}`}>
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors min-h-[44px] text-sm">
                              View Student
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance-related Risk Flags */}
          {organizedFlags.attendance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
                  Attendance-related Risk Flags ({organizedFlags.attendance.length})
                </CardTitle>
                <p className="text-sm text-neutral-600 mt-1">
                  {getTypeDescription('attendance')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizedFlags.attendance.map((flag: any) => (
                    <div
                      key={flag._id}
                      className={`p-4 border rounded-xl ${
                        flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                          ? 'bg-red-50 border-red-200'
                          : flag.severity === 'MEDIUM'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(flag.severity)}
                            {getTypeBadge(flag.type)}
                            {!flag.isActive && (
                              <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <Link
                            to={`/students/${flag.studentId?._id || flag.studentId}`}
                            className="block"
                          >
                            <h3 className="font-medium text-neutral-900 hover:text-primary-600 mb-1">
                              {flag.title || `${flag.studentId?.firstName} ${flag.studentId?.lastName}`}
                            </h3>
                          </Link>
                          <p className="text-sm text-neutral-700 mb-2">
                            <strong>Student:</strong>{' '}
                            <Link
                              to={`/students/${flag.studentId?._id || flag.studentId}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {flag.studentId?.firstName} {flag.studentId?.lastName}
                            </Link>
                          </p>
                          <p className="text-sm text-neutral-700 line-clamp-2">
                            {flag.description || flag.reason || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                            <span>
                              Created: {new Date(flag.createdAt).toLocaleDateString()}
                            </span>
                            {flag.createdBy?.name && (
                              <span>By: {flag.createdBy.name}</span>
                            )}
                            {flag.resolvedAt && (
                              <span>
                                Resolved: {new Date(flag.resolvedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link to={`/students/${flag.studentId?._id || flag.studentId}`}>
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors min-h-[44px] text-sm">
                              View Student
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance-related Risk Flags */}
          {organizedFlags.performance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-purple-600" />
                  Performance-related Risk Flags ({organizedFlags.performance.length})
                </CardTitle>
                <p className="text-sm text-neutral-600 mt-1">
                  {getTypeDescription('performance')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organizedFlags.performance.map((flag: any) => (
                <div
                  key={flag._id}
                  className={`p-4 border rounded-xl ${
                    flag.severity === 'CRITICAL' || flag.severity === 'HIGH'
                      ? 'bg-red-50 border-red-200'
                      : flag.severity === 'MEDIUM'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(flag.severity)}
                        {getTypeBadge(flag.type)}
                        {!flag.isActive && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <Link
                        to={`/students/${flag.studentId?._id || flag.studentId}`}
                        className="block"
                      >
                        <h3 className="font-medium text-neutral-900 hover:text-primary-600 mb-1">
                          {flag.title || `${flag.studentId?.firstName} ${flag.studentId?.lastName}`}
                        </h3>
                      </Link>
                      <p className="text-sm text-neutral-700 mb-2">
                        <strong>Student:</strong>{' '}
                        <Link
                          to={`/students/${flag.studentId?._id || flag.studentId}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {flag.studentId?.firstName} {flag.studentId?.lastName}
                        </Link>
                      </p>
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {flag.description || flag.reason || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>
                          Created: {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                        {flag.createdBy?.name && (
                          <span>By: {flag.createdBy.name}</span>
                        )}
                        {flag.resolvedAt && (
                          <span>
                            Resolved: {new Date(flag.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link to={`/students/${flag.studentId?._id || flag.studentId}`}>
                        <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors min-h-[44px] text-sm">
                          View Student
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

