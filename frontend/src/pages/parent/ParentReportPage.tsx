import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// API client
const apiClient = {
  getParentChildren: async () => {
    const response = await fetch('/api/parent/children')
    return response.json()
  },
  getChildAttendance: async (childId: string) => {
    const response = await fetch(`/api/parent/children/${childId}/attendance`)
    return response.json()
  },
  getChildPerformance: async (childId: string) => {
    const response = await fetch(`/api/parent/children/${childId}/performance`)
    return response.json()
  }
}

export function ParentReportPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'attendance' | 'performance'>('attendance')

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => apiClient.getParentChildren(),
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['child-attendance', selectedChild],
    queryFn: () => apiClient.getChildAttendance(selectedChild!),
    enabled: !!selectedChild,
  })

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['child-performance', selectedChild],
    queryFn: () => apiClient.getChildPerformance(selectedChild!),
    enabled: !!selectedChild,
  })

  const selectedChildData = children?.data?.find((child: any) => child._id === selectedChild)

  const handleExportCSV = () => {
    // Mock CSV export
    const csvData = selectedChildData ? 
      `Name,Class,Attendance Rate,Performance\n${selectedChildData.firstName} ${selectedChildData.lastName},${selectedChildData.classroomId},85%,78%` : ''
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedChildData?.firstName || 'child'}-report.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (childrenLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Student Report</h1>
          <p className="text-neutral-600">Attendance and performance report for your child</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Child Selection */}
      {children?.data && children.data.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {children.data.map((child: any) => (
                <button
                  key={child._id}
                  onClick={() => setSelectedChild(child._id)}
                  className={`p-4 border rounded-xl text-left transition-colors ${
                    selectedChild === child._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-sm text-neutral-600">{child.classroomId}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChildData && (
        <>
          {/* Child Info */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-primary-600">
                    {selectedChildData.firstName.charAt(0)}{selectedChildData.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {selectedChildData.firstName} {selectedChildData.lastName}
                  </h2>
                  <p className="text-neutral-600">{selectedChildData.classroomId}</p>
                  <p className="text-sm text-neutral-500">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Performance
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'attendance' && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="animate-pulse">
                    <div className="h-64 bg-neutral-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Attendance Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                          {attendance?.data?.present || 0}
                        </div>
                        <div className="text-sm text-neutral-600">Present Days</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl">
                        <div className="text-2xl font-bold text-red-600">
                          {attendance?.data?.absent || 0}
                        </div>
                        <div className="text-sm text-neutral-600">Absent Days</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">
                          {attendance?.data?.rate || 0}%
                        </div>
                        <div className="text-sm text-neutral-600">Attendance Rate</div>
                      </div>
                    </div>

                    {/* Attendance Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendance?.data?.trend || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Report</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="animate-pulse">
                    <div className="h-64 bg-neutral-200 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Performance Summary */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {performance?.data?.subjects?.map((subject: any) => (
                        <div key={subject.name} className="text-center p-4 bg-neutral-50 rounded-xl">
                          <div className="text-lg font-bold text-neutral-900">
                            {subject.score}%
                          </div>
                          <div className="text-sm text-neutral-600">{subject.name}</div>
                          <Badge variant={subject.score >= 80 ? 'success' : subject.score >= 60 ? 'warning' : 'error'}>
                            {subject.score >= 80 ? 'Excellent' : subject.score >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Performance Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performance?.data?.subjects || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="score" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedChild && children?.data && children.data.length === 1 && (
        <div className="text-center py-12">
          <p className="text-neutral-600">No child selected. Please select a child to view their report.</p>
        </div>
      )}
    </div>
  )
}
