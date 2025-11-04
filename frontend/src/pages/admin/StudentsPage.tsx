import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link, useNavigate } from 'react-router-dom'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { Student, StudentFilters } from '@/types'

export function StudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [filters, setFilters] = useState<StudentFilters & { page: number }>({
    search: '',
    classroomId: '',
    gender: undefined,
    riskLevel: undefined,
    page: 1,
  })

  const { data: studentsResponse, isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => apiClient.getStudents(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const students = studentsResponse?.data || []
  const pagination = studentsResponse?.pagination

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage })
  }

  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`)
  }

  const handleDelete = async (studentId: string, studentName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(studentId)
        alert('Student deleted successfully')
      } catch (error) {
        alert('Failed to delete student. Please try again.')
        console.error('Delete error:', error)
      }
    }
  }

  const canDelete = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Students</h1>
          <p className="text-sm sm:text-base text-neutral-600">Manage student information and track their progress</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="pl-10 input"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Class
              </label>
              <select
                className="input"
                value={filters.classroomId}
                onChange={(e) => setFilters({ ...filters, classroomId: e.target.value })}
              >
                <option value="">All Classes</option>
                <option value="class-1">P5A</option>
                <option value="class-2">P5B</option>
                <option value="class-3">P6A</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Gender
              </label>
              <select
                className="input"
                value={filters.gender || ''}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value === '' ? undefined : e.target.value as 'M' | 'F' })}
              >
                <option value="">All Genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Risk Level
              </label>
              <select
                className="input"
                value={filters.riskLevel || ''}
                onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value === '' ? undefined : e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
              >
                <option value="">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Students ({pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-neutral-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {students.map((student: Student) => (
                      <tr 
                        key={student._id} 
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                        onClick={() => handleStudentClick(student._id)}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {(student as any).profilePicture ? (
                              <img
                                src={(student as any).profilePicture}
                                alt={`${student.firstName} ${student.lastName}`}
                                className="h-10 w-10 rounded-full object-cover border-2 border-primary-200"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-200">
                                <span className="text-sm font-medium text-primary-600">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {student.guardianContacts[0]?.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {student.gender === 'M' ? 'Male' : 'Female'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                          {student.classId?.className || student.className || 'Not assigned'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              (student as any).riskLevel === 'HIGH' ? 'error' : 
                              (student as any).riskLevel === 'MEDIUM' ? 'warning' : 'low'
                            }
                          >
                            {(student as any).riskLevel || 'LOW'} Risk
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStudentClick(student._id)
                              }}
                              className="flex items-center gap-2"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </Button>
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDelete(student._id, `${student.firstName} ${student.lastName}`, e)}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteMutation.isPending}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-neutral-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-neutral-700">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
