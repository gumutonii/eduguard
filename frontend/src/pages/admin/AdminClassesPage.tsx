import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  AcademicCapIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { useState } from 'react'

export function AdminClassesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => apiClient.getClasses(),
  })

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.getDashboardStats(),
  })

  const createClassMutation = useMutation({
    mutationFn: (classData: any) => apiClient.createClass(classData),
    onSuccess: () => {
      // Invalidate all related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setShowCreateForm(false)
    }
  })

  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => apiClient.deleteClass(classId),
    onSuccess: () => {
      // Invalidate all related queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    }
  })

  if (classesLoading || dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (classesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading classes</h3>
            <p className="mt-2 text-gray-600">Failed to fetch class data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const classes = classesData?.data || []
  const dashboard = dashboardData?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage classes in your school</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      {/* School Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalClasses || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <UserIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalTeachers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <BuildingOfficeIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.atRiskStudents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Class Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const classData = {
                className: formData.get('className') as string
              }
              createClassMutation.mutate(classData)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  name="className"
                  type="text"
                  required
                  className="mt-1 input"
                  placeholder="e.g., P1 A, P2 B, S1 Science, S6 PCB"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClassMutation.isPending}>
                  {createClassMutation.isPending ? 'Adding...' : '+ Add'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classes List */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No classes found</h3>
            <p className="mt-2 text-gray-600">Create your first class to get started.</p>
            <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((classItem, index) => (
            <Card 
              key={classItem._id || index} 
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => window.location.href = `/classes/${classItem._id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{classItem.className || classItem.fullName}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${classItem.className || classItem.fullName}?`)) {
                          deleteClassMutation.mutate(classItem._id);
                        }
                      }}
                      disabled={deleteClassMutation.isPending}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Students</span>
                    <span className="font-medium">{classItem.studentCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Teacher</span>
                    <div className="flex items-center space-x-1">
                      {classItem.assignedTeacher ? (
                        <>
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-600 font-medium">Assigned</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-500">Unassigned</span>
                        </>
                      )}
                    </div>
                  </div>

                  {classItem.assignedTeacher && (
                    <div className="border-t pt-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-3 w-3 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{classItem.assignedTeacher.name}</p>
                          {classItem.assignedTeacher.teacherTitle && (
                            <p className="text-xs text-gray-500 truncate">{classItem.assignedTeacher.teacherTitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-1">
                    <Link 
                      to={`/classes/${classItem._id}`} 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs h-7"
                      >
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        Students
                      </Button>
                    </Link>
                    <Link 
                      to={`/classes/${classItem._id}/assign-teacher`} 
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs h-7"
                      >
                        <UserIcon className="h-3 w-3 mr-1" />
                        Teacher
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
