import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  BuildingOfficeIcon, 
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/api'

export function AllSchoolsPage() {
  const queryClient = useQueryClient()

  const { data: schoolsData, isLoading: schoolsLoading, error: schoolsError } = useQuery({
    queryKey: ['all-schools'],
    queryFn: () => apiClient.getAllSchools(),
    staleTime: 30000, // 30 seconds - data is fresh for 30 seconds
    gcTime: 300000, // 5 minutes - keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus for real-time updates
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
  })

  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => apiClient.getSystemStats(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Real-time updates
    refetchOnMount: true,
  })

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: (schoolId: string) => apiClient.deleteSchool(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-schools'] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] })
    },
  })

  const handleDelete = (school: any) => {
    if (window.confirm(`Are you sure you want to delete ${school.name || school.schoolName}? This action cannot be undone.`)) {
      deleteSchoolMutation.mutate(school._id)
    }
  }

  if (schoolsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (schoolsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading schools</h3>
            <p className="mt-2 text-gray-600">Failed to fetch school data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const schools = schoolsData?.data || []
  const stats = systemStats?.data || {} as any

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and view all schools in the system</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          {schools.length} total schools
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRiskStudents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Schools ({schools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
      {schools.length === 0 ? (
            <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No schools found</h3>
            <p className="mt-2 text-gray-600">No schools have been registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">School</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">Users</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">Admins</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">Teachers</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden md:table-cell">Classes</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">Students</th>
                        <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schools.map((school, index) => (
                        <tr 
                          key={school._id || index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{school.name || school.schoolName || 'N/A'}</p>
                                {/* Mobile: Show key stats inline */}
                                <div className="md:hidden mt-1 text-xs text-gray-500">
                                  {school.totalUsers || 0} users • {school.totalClasses || school.classes || 0} classes
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden md:table-cell">
                            <p className="text-sm font-medium text-gray-900">{school.totalUsers || 0}</p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden lg:table-cell">
                            <p className="text-sm text-gray-900">{school.admins || 0}</p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden lg:table-cell">
                            <p className="text-sm text-gray-900">{school.teachers || 0}</p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden md:table-cell">
                            <p className="text-sm text-gray-900">{school.totalClasses || school.classes || 0}</p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap hidden sm:table-cell">
                            <p className="text-sm font-medium text-gray-900">{school.totalStudents || 0}</p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Link 
                                to={`/schools/${school._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  title="View"
                                >
                                  <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(school)
                                }}
                                disabled={deleteSchoolMutation.isPending}
                                title="Delete"
                              >
                                <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
                  )}
              </CardContent>
            </Card>
    </div>
  )
}
