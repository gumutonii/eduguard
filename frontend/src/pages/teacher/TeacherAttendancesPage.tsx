import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  CalendarIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useState } from 'react'

export function TeacherAttendancesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const queryClient = useQueryClient()

  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useQuery({
    queryKey: ['teacher-attendance', selectedDate],
    queryFn: () => apiClient.getAttendance({ date: selectedDate }),
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => apiClient.getStudents(),
  })

  const markAttendanceMutation = useMutation({
    mutationFn: (attendanceRecords: any[]) => apiClient.markAttendance(attendanceRecords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] })
      setShowMarkAttendance(false)
    }
  })

  if (attendanceLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (attendanceError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading attendance</h3>
            <p className="mt-2 text-gray-600">Failed to fetch attendance data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const attendance = attendanceData?.data || []
  const students = studentsData?.data || []

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find((a: any) => a.studentId === studentId)
    return record ? record.status : 'ABSENT'
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'ABSENT': return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'LATE': return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default: return <XCircleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const present = attendance.filter((a: any) => a.status === 'PRESENT').length
    const absent = attendance.filter((a: any) => a.status === 'ABSENT').length
    const late = attendance.filter((a: any) => a.status === 'LATE').length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, attendanceRate }
  }

  const stats = getAttendanceStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
          <Button onClick={() => setShowMarkAttendance(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Attendance Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <ClockIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Mark Attendance Form */}
      {showMarkAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance for {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const attendanceRecords = students.map((student: any) => ({
                studentId: student._id,
                status: formData.get(`attendance_${student._id}`) as string,
                date: selectedDate,
                notes: formData.get(`notes_${student._id}`) as string || ''
              }))
              markAttendanceMutation.mutate(attendanceRecords)
            }} className="space-y-4">
              <div className="grid gap-4">
                {students.map((student: any) => (
                  <div key={student._id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{student.firstName} {student.lastName}</h4>
                      <p className="text-sm text-gray-500">{student.gender}, Age {student.age}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        name={`attendance_${student._id}`}
                        defaultValue={getAttendanceStatus(student._id)}
                        className="input"
                        required
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                      </select>
                      <input
                        name={`notes_${student._id}`}
                        type="text"
                        placeholder="Notes (optional)"
                        className="input"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowMarkAttendance(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={markAttendanceMutation.isPending}>
                  {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No students found</h3>
              <p className="mt-2 text-gray-600">No students have been registered in your class yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student: any) => {
                const status = getAttendanceStatus(student._id)
                return (
                  <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getAttendanceIcon(status)}
                      <div>
                        <h4 className="font-medium">{student.firstName} {student.lastName}</h4>
                        <p className="text-sm text-gray-500">{student.gender}, Age {student.age}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getAttendanceColor(status)}>
                        {status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
