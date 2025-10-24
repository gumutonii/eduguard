import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  UserGroupIcon, 
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

export function ClassStudentsPage() {
  const { id } = useParams<{ id: string }>()

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: () => apiClient.getClass(id!),
  })

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', id],
    queryFn: () => apiClient.getClassStudents(id!),
  })

  if (classLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/classes">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const classInfo = classData?.data
  const students = studentsData?.data || []

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskDisplayName = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'Critical Risk'
      case 'HIGH': return 'High Risk'
      case 'MEDIUM': return 'Medium Risk'
      case 'LOW': return 'Low Risk'
      default: return 'No Risk'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/classes">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classInfo?.className || classInfo?.fullName}</h1>
            <p className="text-gray-600">Students in this class</p>
          </div>
        </div>
      </div>

      {/* Class Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{students.length}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {students.filter((s: any) => s.riskLevel === 'LOW' || !s.riskLevel).length}
              </div>
              <div className="text-sm text-gray-500">Low Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {students.filter((s: any) => ['HIGH', 'CRITICAL'].includes(s.riskLevel)).length}
              </div>
              <div className="text-sm text-gray-500">At Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No students in this class</h3>
            <p className="mt-2 text-gray-600">
              Students will appear here once they are assigned to this class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student: any, index: number) => (
            <Card key={student._id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-600">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {student.gender}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          Age: {student.age}
                        </Badge>
                        {student.riskLevel && (
                          <Badge className={getRiskColor(student.riskLevel)}>
                            {getRiskDisplayName(student.riskLevel)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link to={`/students/${student._id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {student.guardianContacts && student.guardianContacts.length > 0 ? (
                          student.guardianContacts.map((guardian: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              <span>{guardian.name} ({guardian.relation})</span>
                              {guardian.phone && (
                                <div className="flex items-center space-x-1">
                                  <PhoneIcon className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs">{guardian.phone}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No guardian contacts</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Address</h4>
                      <div className="text-sm text-gray-600">
                        {student.address ? (
                          <div className="flex items-start space-x-1">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p>{student.address.district}, {student.address.sector}</p>
                              <p className="text-xs text-gray-500">
                                {student.address.cell}, {student.address.village}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">No address information</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {student.socioEconomic && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Socio-Economic Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Ubudehe Level:</span>
                          <span className="ml-1 font-medium">{student.socioEconomic.ubudeheLevel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Siblings:</span>
                          <span className="ml-1 font-medium">{student.socioEconomic.numberOfSiblings}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Parent Education:</span>
                          <span className="ml-1 font-medium">{student.socioEconomic.parentEducationLevel}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Family Conflict:</span>
                          <span className="ml-1 font-medium">
                            {student.socioEconomic.familyConflict ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
