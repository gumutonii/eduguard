import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  UserIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { Student, Attendance, Performance, RiskFlag, Intervention } from '@/types'

// API client
const apiClient = {
  getStudent: async (id: string) => {
    const response = await fetch(`/api/students/${id}`)
    return response.json()
  },
  getStudentAttendance: async (id: string) => {
    const response = await fetch(`/api/attendance?studentId=${id}`)
    return response.json()
  },
  getStudentPerformance: async (id: string) => {
    const response = await fetch(`/api/performance?studentId=${id}`)
    return response.json()
  },
  getStudentRiskFlags: async (id: string) => {
    const response = await fetch(`/api/risk-flags?studentId=${id}`)
    return response.json()
  },
  getStudentInterventions: async (id: string) => {
    const response = await fetch(`/api/interventions?studentId=${id}`)
    return response.json()
  }
}

const tabs = [
  { id: 'overview', name: 'Overview', icon: UserIcon },
  { id: 'attendance', name: 'Attendance', icon: ClipboardDocumentCheckIcon },
  { id: 'performance', name: 'Performance', icon: ChartBarIcon },
  { id: 'risk', name: 'Risk Center', icon: ExclamationTriangleIcon },
  { id: 'interventions', name: 'Interventions', icon: ClipboardDocumentListIcon },
  { id: 'report', name: 'Report', icon: DocumentTextIcon },
]

export function TeacherStudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.getStudent(id!),
    enabled: !!id,
  })

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => apiClient.getStudentAttendance(id!),
    enabled: !!id && activeTab === 'attendance',
  })

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['student-performance', id],
    queryFn: () => apiClient.getStudentPerformance(id!),
    enabled: !!id && activeTab === 'performance',
  })

  const { data: riskFlagsData, isLoading: riskFlagsLoading } = useQuery({
    queryKey: ['student-risk-flags', id],
    queryFn: () => apiClient.getStudentRiskFlags(id!),
    enabled: !!id && activeTab === 'risk',
  })

  const { data: interventionsData, isLoading: interventionsLoading } = useQuery({
    queryKey: ['student-interventions', id],
    queryFn: () => apiClient.getStudentInterventions(id!),
    enabled: !!id && activeTab === 'interventions',
  })

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-16 bg-neutral-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-neutral-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const student = studentData?.data
  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral-900">Student not found</h2>
        <p className="text-neutral-600">The student you're looking for doesn't exist.</p>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Key Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Date of Birth</p>
                    <p className="text-neutral-900">{new Date(student.dob || '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Age</p>
                    <p className="text-neutral-900">
                      {student.dob ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years old
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Class</p>
                    <p className="text-neutral-900">{student.classroomId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-600">Status</p>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceData?.data?.slice(0, 5).map((attendance: Attendance) => (
                    <div key={attendance._id} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {new Date(attendance.date).toLocaleDateString()}
                      </span>
                      <Badge variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'error' : 'warning'}>
                        {attendance.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData?.data?.slice(0, 5).map((performance: Performance) => (
                    <div key={performance._id} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">{performance.subject}</span>
                      <span className="text-sm font-medium text-neutral-900">{performance.score}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'attendance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceData?.data?.map((attendance: Attendance) => (
                      <div key={attendance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {new Date(attendance.date).toLocaleDateString()}
                          </p>
                          {attendance.notes && (
                            <p className="text-sm text-neutral-600">{attendance.notes}</p>
                          )}
                        </div>
                        <Badge variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'error' : 'warning'}>
                          {attendance.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'performance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {performanceData?.data?.map((performance: Performance) => (
                      <div key={performance._id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900">{performance.subject}</p>
                          <p className="text-sm text-neutral-600">
                            {performance.term} • {new Date(performance.date).toLocaleDateString()}
                          </p>
                          {performance.notes && (
                            <p className="text-sm text-neutral-500 mt-1">{performance.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-neutral-900">{performance.score}%</p>
                          <Badge variant={performance.score >= 80 ? 'success' : performance.score >= 60 ? 'warning' : 'error'}>
                            {performance.score >= 80 ? 'Excellent' : performance.score >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'risk':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskFlagsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riskFlagsData?.data?.map((riskFlag: RiskFlag) => (
                      <div key={riskFlag._id} className={`p-4 border rounded-xl ${
                        riskFlag.level === 'HIGH' ? 'bg-red-50 border-red-200' :
                        riskFlag.level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${
                              riskFlag.level === 'HIGH' ? 'text-red-800' :
                              riskFlag.level === 'MEDIUM' ? 'text-yellow-800' :
                              'text-green-800'
                            }`}>
                              Risk Level: {riskFlag.level}
                            </p>
                            <p className={`text-sm ${
                              riskFlag.level === 'HIGH' ? 'text-red-600' :
                              riskFlag.level === 'MEDIUM' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              Reasons: {riskFlag.reasons.join(', ')}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              Status: {riskFlag.status} • Created: {new Date(riskFlag.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={riskFlag.level.toLowerCase() as 'low' | 'medium' | 'high'}>
                            {riskFlag.level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'interventions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Intervention History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interventionsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-neutral-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interventionsData?.data?.map((intervention: Intervention) => (
                      <div key={intervention._id} className="p-4 border border-neutral-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{intervention.title}</p>
                            {intervention.description && (
                              <p className="text-sm text-neutral-600 mt-1">{intervention.description}</p>
                            )}
                            <p className="text-xs text-neutral-500 mt-1">
                              Due: {intervention.dueDate ? new Date(intervention.dueDate).toLocaleDateString() : 'No due date'}
                            </p>
                          </div>
                          <Badge variant={intervention.status === 'DONE' ? 'success' : intervention.status === 'PLANNED' ? 'info' : 'error'}>
                            {intervention.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'report':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Student Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-neutral-900">Student Summary Report</h3>
                  <p className="text-neutral-600">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <h4 className="font-medium text-neutral-900">Student Information</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      Name: {student.firstName} {student.lastName}<br />
                      Gender: {student.gender === 'M' ? 'Male' : 'Female'}<br />
                      Class: {student.classroomId}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <h4 className="font-medium text-neutral-900">Contact Information</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      Guardian: {student.guardianContacts[0]?.name}<br />
                      Phone: {student.guardianContacts[0]?.phone || 'N/A'}<br />
                      Email: {student.guardianContacts[0]?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={() => window.print()}>
                    Print Report
                  </Button>
                  <Button variant="outline">
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-medium text-primary-600">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-neutral-600">
              Student ID: {student._id.slice(-8)} • {student.classroomId} • {student.gender === 'M' ? 'Male' : 'Female'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="low">Low Risk</Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}
