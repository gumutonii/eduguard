import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeftIcon,
  AcademicCapIcon,
  UserIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

export function AssignTeacherPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => apiClient.getClass(id!),
  })

  // Fetch available teachers from the same school
  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['school-teachers', user?.schoolId],
    queryFn: () => apiClient.getTeachers(),
  })

  const classInfo = classData?.data
  const teachers = teachersData?.data || []

  // Filter to only show approved teachers without assigned classes or can reassign
  const availableTeachers = teachers.filter((teacher: any) => 
    teacher.isApproved && 
    teacher.isActive &&
    teacher.role === 'TEACHER'
  )

  // Assignment mutation
  const assignTeacherMutation = useMutation({
    mutationFn: (teacherId: string) => 
      apiClient.assignTeacherToClass(id!, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] }) // Invalidate teacher's profile
      queryClient.invalidateQueries({ queryKey: ['school-teachers'] }) // Invalidate teachers list
      alert('Teacher assigned to class successfully!')
      navigate('/classes')
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to assign teacher to class')
    }
  })

  const handleAssign = () => {
    if (!selectedTeacherId) {
      alert('Please select a teacher')
      return
    }
    if (confirm(`Assign this teacher to ${classInfo?.className}?`)) {
      assignTeacherMutation.mutate(selectedTeacherId)
    }
  }

  if (classLoading || teachersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!classInfo) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-600">Class not found</p>
            <Link to="/classes">
              <Button variant="outline" className="mt-4">
                Back to Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/classes">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Assign Teacher to Class</h1>
            <p className="text-neutral-600">Select a teacher to assign to this class</p>
          </div>
        </div>
      </div>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Class Name</p>
              <p className="text-lg font-semibold">{classInfo.className}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Grade</p>
              <p className="text-lg font-semibold">{classInfo.grade || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Section</p>
              <p className="text-lg font-semibold">{classInfo.section || 'N/A'}</p>
            </div>
          </div>
          {classInfo.assignedTeacher && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Currently Assigned:</strong> {classInfo.assignedTeacher.name}
                {classInfo.assignedTeacher.teacherTitle && ` - ${classInfo.assignedTeacher.teacherTitle}`}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Assigning a new teacher will replace the current assignment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Select Teacher
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTeachers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-4 text-lg font-medium text-neutral-900">No Teachers Available</h3>
              <p className="mt-2 text-neutral-600">
                No approved teachers are available for assignment. Please approve teachers first.
              </p>
              <Link to="/approvals">
                <Button variant="outline" className="mt-4">
                  Go to Approvals
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Choose a teacher to assign
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select a teacher...</option>
                  {availableTeachers.map((teacher: any) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                      {teacher.teacherTitle ? ` - ${teacher.teacherTitle}` : ''}
                      {teacher.className ? ` (Currently: ${teacher.className})` : ' (Unassigned)'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTeacherId && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg border">
                  {(() => {
                    const selectedTeacher = availableTeachers.find((t: any) => t._id === selectedTeacherId)
                    return selectedTeacher ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedTeacher.name}</span>
                          <Badge variant="success">Approved</Badge>
                        </div>
                        {selectedTeacher.teacherTitle && (
                          <p className="text-sm text-neutral-600">
                            {selectedTeacher.teacherTitle}
                          </p>
                        )}
                        {selectedTeacher.className && (
                          <p className="text-xs text-amber-600">
                            Currently assigned to: {selectedTeacher.className}
                          </p>
                        )}
                        {selectedTeacher.email && (
                          <p className="text-xs text-neutral-500">
                            Email: {selectedTeacher.email}
                          </p>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleAssign}
                  disabled={!selectedTeacherId || assignTeacherMutation.isPending}
                  loading={assignTeacherMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Assign Teacher
                </Button>
                <Link to="/classes">
                  <Button variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

