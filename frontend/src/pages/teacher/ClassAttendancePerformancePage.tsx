import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useState, useEffect } from 'react'

export function ClassAttendancePerformancePage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  
  // Get current week (Monday to Friday)
  const getCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    
    const week = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      week.push(date)
    }
    return week
  }

  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek())
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, boolean>>>({})
  const [performanceData, setPerformanceData] = useState<Record<string, { term: string; score: number }>>({})
  const [activeTab, setActiveTab] = useState<'attendance' | 'performance'>('attendance')
  const [selectedTerm, setSelectedTerm] = useState('TERM_1')

  // Get class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => apiClient.getClass(id!),
    enabled: !!id
  })

  // Get students for this class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', id],
    queryFn: () => apiClient.getClassStudents(id!),
    enabled: !!id
  })

  const students = studentsData?.data || []

  // Get existing attendance for the selected week
  const { data: attendanceRecords, refetch: refetchAttendance, isLoading: attendanceLoading } = useQuery<any[]>({
    queryKey: ['class-attendance', id, selectedWeek[0].toISOString().split('T')[0]],
    queryFn: async () => {
      try {
        const startDate = selectedWeek[0].toISOString().split('T')[0]
        const endDate = selectedWeek[4].toISOString().split('T')[0]
        const response = await apiClient.getAttendance({ 
          startDate, 
          endDate,
          classId: id 
        })
        // Ensure we always return an array
        if (response && response.success && Array.isArray(response.data)) {
          return response.data
        }
        return []
      } catch (error) {
        console.error('Error fetching attendance:', error)
        return []
      }
    },
    enabled: !!id && activeTab === 'attendance' && students.length > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true // Always refetch on mount
  })

  // Initialize attendance data from existing records
  useEffect(() => {
    if (students.length > 0 && attendanceRecords) {
      const initialData: Record<string, Record<string, boolean>> = {}
      students.forEach((student: any) => {
        initialData[student._id] = {}
        selectedWeek.forEach((date) => {
          const dateStr = date.toISOString().split('T')[0]
          
          // Find matching record - handle different data structures
          const record = attendanceRecords.find((r: any) => {
            // Handle both populated and non-populated studentId
            const recordStudentId = r.studentId?._id || r.student?._id || r.studentId
            // Normalize date comparison
            const recordDate = r.date ? new Date(r.date).toISOString().split('T')[0] : null
            return recordStudentId && recordDate && 
                   recordStudentId.toString() === student._id.toString() && 
                   recordDate === dateStr
          })
          
          // Mark as present if status is PRESENT or LATE
          initialData[student._id][dateStr] = record?.status === 'PRESENT' || record?.status === 'LATE'
        })
      })
      setAttendanceData(initialData)
    } else if (students.length === 0) {
      // Reset if no students
      setAttendanceData({})
    }
  }, [attendanceRecords, students, selectedWeek])

  // Get existing performance records for selected term
  const { data: performanceRecords, refetch: refetchPerformance } = useQuery({
    queryKey: ['class-performance', id, selectedTerm],
    queryFn: async () => {
      const currentYear = new Date().getFullYear()
      const academicYear = `${currentYear}-${currentYear + 1}`
      
      // If Annual is selected, fetch all 3 terms
      if (selectedTerm === 'ANNUAL') {
        const [term1, term2, term3] = await Promise.all([
          apiClient.getPerformance({ classId: id, term: 'TERM_1', academicYear }),
          apiClient.getPerformance({ classId: id, term: 'TERM_2', academicYear }),
          apiClient.getPerformance({ classId: id, term: 'TERM_3', academicYear })
        ])
        return {
          TERM_1: term1.data || [],
          TERM_2: term2.data || [],
          TERM_3: term3.data || []
        }
      } else {
        const response = await apiClient.getPerformance({ 
          classId: id,
          term: selectedTerm,
          academicYear
        })
        return response.data || []
      }
    },
    enabled: !!id && activeTab === 'performance' && students.length > 0
  })

  // Initialize performance data from existing records
  useEffect(() => {
    if (performanceRecords && students.length > 0) {
      const initialData: Record<string, { term: string; score: number }> = {}
      
      if (selectedTerm === 'ANNUAL') {
        // Calculate annual average from all 3 terms: (Term 1 + Term 2 + Term 3) / 3
        students.forEach((student: any) => {
          const studentId = student._id
          const term1Record = (performanceRecords as any).TERM_1?.find((r: any) => 
            (r.studentId?._id || r.studentId) === studentId
          )
          const term2Record = (performanceRecords as any).TERM_2?.find((r: any) => 
            (r.studentId?._id || r.studentId) === studentId
          )
          const term3Record = (performanceRecords as any).TERM_3?.find((r: any) => 
            (r.studentId?._id || r.studentId) === studentId
          )
          
          // Get scores, treating missing terms as 0
          const term1Score = term1Record?.score ?? 0
          const term2Score = term2Record?.score ?? 0
          const term3Score = term3Record?.score ?? 0
          
          // Calculate average: (Term 1 + Term 2 + Term 3) / 3
          const average = (term1Score + term2Score + term3Score) / 3
          
          initialData[studentId] = {
            term: 'ANNUAL',
            score: Math.round(average * 10) / 10 // Round to 1 decimal place
          }
        })
      } else {
        // Regular term data
        const records = Array.isArray(performanceRecords) ? performanceRecords : []
        students.forEach((student: any) => {
          const record = records.find((r: any) => 
            (r.studentId?._id || r.studentId) === student._id
          )
          if (record) {
            // Include 0% scores (record.score can be 0)
            initialData[student._id] = {
              term: selectedTerm,
              score: record.score !== undefined && record.score !== null ? record.score : 0
            }
          }
        })
      }
      
      setPerformanceData(initialData)
    }
  }, [performanceRecords, students, selectedTerm])

  // Save attendance mutation with optimistic updates
  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      const records: any[] = []
      students.forEach((student: any) => {
        selectedWeek.forEach((date) => {
          const dateStr = date.toISOString().split('T')[0]
          const isPresent = attendanceData[student._id]?.[dateStr] || false
          records.push({
            studentId: student._id,
            date: dateStr,
            status: isPresent ? 'PRESENT' : 'ABSENT'
          })
        })
      })
      return apiClient.markAttendance(records)
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['class-attendance', id] })
      
      // Snapshot the previous value
      const previousAttendance = queryClient.getQueryData(['class-attendance', id, selectedWeek[0].toISOString().split('T')[0]])
      
      // Optimistically update the UI - data is already in state, just mark as saved
      return { previousAttendance }
    },
    onSuccess: async (response) => {
      // Update query cache with saved data for immediate UI update
      if (response.success && response.data && Array.isArray(response.data)) {
        const startDate = selectedWeek[0].toISOString().split('T')[0]
        
        // Update cache with saved records
        queryClient.setQueryData(['class-attendance', id, startDate], (old: any) => {
          const oldRecords = Array.isArray(old) ? old : []
          
          // Merge new records with existing ones
          const existingMap = new Map(oldRecords.map((r: any) => {
            const studentId = r.studentId?._id || r.student?.id || r.studentId
            const recordDate = r.date ? new Date(r.date).toISOString().split('T')[0] : null
            const key = `${studentId}_${recordDate}`
            return [key, r]
          }))
          
          // Add/update with new records from response
          response.data.forEach((record: any) => {
            const studentId = record.studentId?._id || record.studentId
            const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : null
            if (studentId && recordDate) {
              const key = `${studentId}_${recordDate}`
              existingMap.set(key, record)
            }
          })
          
          return Array.from(existingMap.values())
        })
      }
      
      // Invalidate and refetch to ensure consistency (similar to performance mutation)
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      queryClient.invalidateQueries({ queryKey: ['student-attendance'] })
      
      // Silently refetch in background (non-blocking, like performance)
      refetchAttendance().catch(() => {})
      
      // Show success message
      if (response.success) {
        const savedCount = response.data?.length || 0
        console.log(`Attendance saved successfully: ${savedCount} records`)
      }
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousAttendance) {
        queryClient.setQueryData(['class-attendance', id, selectedWeek[0].toISOString().split('T')[0]], context.previousAttendance)
      }
      console.error('Error saving attendance:', error)
      alert(`Failed to save attendance: ${error.message || 'Unknown error'}`)
    }
  })

  // Save performance mutation with optimistic updates and bulk endpoint
  const savePerformanceMutation = useMutation({
    mutationFn: async () => {
      // Don't allow saving annual performance (it's auto-calculated)
      if (selectedTerm === 'ANNUAL') {
        throw new Error('Annual performance is auto-calculated and cannot be saved directly. Please save individual term performances.')
      }
      
      const records: any[] = []
      const currentYear = new Date().getFullYear()
      const academicYear = `${currentYear}-${currentYear + 1}`
      
      students.forEach((student: any) => {
        const perf = performanceData[student._id]
        // Allow 0% scores to be saved (score >= 0 instead of score > 0)
        if (perf && perf.score >= 0 && perf.score <= 100) {
          records.push({
            studentId: student._id,
            classId: id,
            academicYear,
            term: selectedTerm,
            subject: 'Overall', // Or allow teacher to select subject
            score: perf.score,
            maxScore: 100,
            assessmentType: 'FINAL'
          })
        }
      })
      
      if (records.length === 0) {
        throw new Error('No performance records to save')
      }
      
      // Use bulk endpoint for faster saving
      return apiClient.bulkCreatePerformance(records)
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['class-performance', id, selectedTerm] })
      
      // Snapshot the previous value
      const previousPerformance = queryClient.getQueryData(['class-performance', id, selectedTerm])
      
      // Optimistically update the UI - data is already in state, just mark as saved
      return { previousPerformance }
    },
    onSuccess: async (response) => {
      // Update query cache with saved data for immediate UI update
      if (response.data && (response.data.created || response.data.updated)) {
        const allRecords = [...(response.data.created || []), ...(response.data.updated || [])]
        
        // Update cache with saved records
        queryClient.setQueryData(['class-performance', id, selectedTerm], (old: any) => {
          if (!old) return allRecords
          
          // Merge new records with existing ones
          const existingMap = new Map((old || []).map((r: any) => {
            const key = `${r.studentId?._id || r.studentId}_${r.term}_${r.subject}`
            return [key, r]
          }))
          
          // Add/update with new records
          allRecords.forEach((record: any) => {
            const key = `${record.studentId?._id || record.studentId}_${record.term}_${record.subject}`
            existingMap.set(key, record)
          })
          
          return Array.from(existingMap.values())
        })
        
        // Also update performanceData state to reflect saved values
        const updatedPerformanceData = { ...performanceData }
        allRecords.forEach((record: any) => {
          const studentId = record.studentId?._id || record.studentId
          if (studentId && record.score !== undefined) {
            updatedPerformanceData[studentId] = {
              term: record.term,
              score: record.score
            }
          }
        })
        setPerformanceData(updatedPerformanceData)
      }
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['class-performance'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
      
      // Silently refetch in background
      refetchPerformance().catch(() => {})
      
      // Show success message
      if (response.success) {
        const totalSaved = (response.data?.created?.length || 0) + (response.data?.updated?.length || 0)
        console.log(`Performance saved successfully: ${totalSaved} records`)
      }
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPerformance) {
        queryClient.setQueryData(['class-performance', id, selectedTerm], context.previousPerformance)
      }
      console.error('Error saving performance:', error)
      alert(`Failed to save performance: ${error.message || 'Unknown error'}`)
    }
  })

  const handleAttendanceToggle = (studentId: string, dateStr: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [dateStr]: !prev[studentId]?.[dateStr]
      }
    }))
  }

  const handlePerformanceChange = (studentId: string, score: number) => {
    // Don't allow editing annual performance (it's auto-calculated)
    if (selectedTerm === 'ANNUAL') {
      return
    }
    
    setPerformanceData(prev => ({
      ...prev,
      [studentId]: {
        term: selectedTerm,
        score: Math.min(100, Math.max(0, score))
      }
    }))
  }

  const getDayName = (date: Date) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    return days[date.getDay() === 0 ? 6 : date.getDay() - 1]
  }

  const getDayShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = selectedWeek.map(date => {
      const newDate = new Date(date)
      newDate.setDate(date.getDate() + (direction === 'next' ? 7 : -7))
      return newDate
    })
    setSelectedWeek(newWeek)
    // Reset attendance data when navigating weeks to trigger refetch
    setAttendanceData({})
  }

  if (classLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const classInfo = classData?.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classInfo?.className || classInfo?.name || 'Class'} - Attendance & Performance
          </h1>
          <p className="text-gray-600">Manage student attendance and performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'attendance'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarIcon className="h-5 w-5 inline mr-2" />
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'performance'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="h-5 w-5 inline mr-2" />
          Performance
        </button>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Attendance</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                  ← Previous Week
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedWeek[0].toLocaleDateString()} - {selectedWeek[4].toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                  Next Week →
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No students in this class</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Student
                      </th>
                      {selectedWeek.map((date, index) => (
                        <th key={index} className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                          <div>{getDayName(date)}</div>
                          <div className="text-xs text-gray-500">{getDayShort(date)}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                        Present
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any) => {
                      const studentAttendance = attendanceData[student._id] || {}
                      const presentCount = selectedWeek.filter(date => {
                        const dateStr = date.toISOString().split('T')[0]
                        return studentAttendance[dateStr]
                      }).length

                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              {student.profilePicture ? (
                                <img
                                  src={student.profilePicture}
                                  alt={`${student.firstName} ${student.lastName}`}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                                  <span className="text-sm font-medium text-primary-600">
                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{student.studentId}</div>
                              </div>
                            </div>
                          </td>
                          {selectedWeek.map((date, index) => {
                            const dateStr = date.toISOString().split('T')[0]
                            const isChecked = studentAttendance[dateStr] || false
                            return (
                              <td key={index} className="px-3 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleAttendanceToggle(student._id, dateStr)}
                                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                />
                              </td>
                            )
                          })}
                          <td className="px-4 py-4 text-center">
                            <Badge variant={presentCount >= 4 ? 'success' : presentCount >= 3 ? 'warning' : 'error'}>
                              {presentCount}/5
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-end">
                  <Button 
                    onClick={() => saveAttendanceMutation.mutate()}
                    disabled={saveAttendanceMutation.isPending}
                  >
                    {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedTerm === 'ANNUAL' ? 'Annual Performance' : 'Overall Term Performance'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTerm === 'ANNUAL' 
                      ? 'Annual performance is automatically calculated as the average of Term 1, Term 2, and Term 3 percentages.'
                      : 'Enter percentage scores (0-100%) for each student.'}
                  </p>
                </div>
              <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Select Term:</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                    className="px-4 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium min-w-[120px]"
                >
                  <option value="TERM_1">Term 1</option>
                  <option value="TERM_2">Term 2</option>
                  <option value="TERM_3">Term 3</option>
                  <option value="ANNUAL">Annual</option>
                </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No students in this class</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Student
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                        Overall Performance (%)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any) => {
                      const perf = performanceData[student._id]
                      const score = perf?.score || 0
                      // Grade calculation: A: 80-100, B: 70-79.9, C: 60-69.9, D: 50-59.9, E: 40-49.9, F: 0-39.9
                      const grade = score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : score >= 40 ? 'E' : 'F'
                      const gradeColor = grade === 'A' || grade === 'B' ? 'success' : grade === 'C' || grade === 'D' ? 'warning' : 'error'

                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              {student.profilePicture ? (
                                <img
                                  src={student.profilePicture}
                                  alt={`${student.firstName} ${student.lastName}`}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                                  <span className="text-sm font-medium text-primary-600">
                                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{student.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              {selectedTerm === 'ANNUAL' ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={score}
                                    readOnly
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                                    placeholder="0-100"
                                  />
                                  <span className="text-gray-600">%</span>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={score}
                                    onChange={(e) => handlePerformanceChange(student._id, parseFloat(e.target.value) || 0)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="0-100"
                                  />
                                  <span className="text-gray-600">%</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge variant={gradeColor}>
                              {grade} ({score}%)
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedTerm === 'ANNUAL' ? (
                      <>
                        <strong>Note:</strong> Annual performance is automatically calculated as the average of Term 1, Term 2, and Term 3 percentages. It cannot be edited directly.
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> This saves the overall grade for <strong>{selectedTerm === 'TERM_1' ? 'Term 1' : selectedTerm === 'TERM_2' ? 'Term 2' : 'Term 3'}</strong> for all students. Each student can have one overall grade per term.
                      </>
                    )}
                  </p>
                  {selectedTerm !== 'ANNUAL' && (
                    <Button 
                      onClick={() => savePerformanceMutation.mutate()}
                      disabled={savePerformanceMutation.isPending}
                    >
                      {savePerformanceMutation.isPending ? 'Saving...' : `Save ${selectedTerm === 'TERM_1' ? 'Term 1' : selectedTerm === 'TERM_2' ? 'Term 2' : 'Term 3'} Performance`}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

