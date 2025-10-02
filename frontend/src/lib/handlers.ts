import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import type { 
  User, 
  Student, 
  Attendance, 
  Performance, 
  RiskFlag, 
  Intervention,
  DashboardStats,
  AtRiskOverview,
  AttendanceTrend,
  PerformanceTrend,
  InterventionPipeline,
  NotificationHistory,
  ApiResponse,
  PaginatedResponse
} from '@/types'

// Mock data generators
const generateUser = (role: 'ADMIN' | 'TEACHER' | 'PARENT' = 'ADMIN'): User => ({
  _id: faker.string.uuid(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  name: faker.person.fullName(),
  role,
  schoolId: faker.string.uuid(),
  isActive: true,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
})

const generateStudent = (): Student => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  
  return {
    _id: faker.string.uuid(),
    firstName,
    lastName,
    gender: faker.helpers.arrayElement(['M', 'F']),
    dob: faker.date.birthdate({ min: 5, max: 18, mode: 'age' }).toISOString(),
    schoolId: faker.string.uuid(),
    classroomId: faker.string.uuid(),
    guardianContacts: [
      {
        name: faker.person.fullName(),
        relation: faker.helpers.arrayElement(['Father', 'Mother', 'Guardian']),
        phone: faker.phone.number(),
        email: faker.internet.email(),
      }
    ],
    socioEconomic: {
      distanceToSchoolKm: faker.number.float({ min: 0.5, max: 15, fractionDigits: 1 }),
      householdSize: faker.number.int({ min: 2, max: 12 }),
      incomeBracket: faker.helpers.arrayElement(['LOW', 'MED', 'HIGH']),
      indicators: faker.helpers.arrayElements([
        'food_insecurity',
        'no_electricity',
        'single_parent',
        'unemployment',
        'health_issues'
      ], { min: 0, max: 3 }),
    },
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  }
}

const generateAttendance = (studentId: string): Attendance => ({
  _id: faker.string.uuid(),
  studentId,
  date: faker.date.recent({ days: 30 }).toISOString(),
  status: faker.helpers.arrayElement(['PRESENT', 'ABSENT', 'EXCUSED']),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()),
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
})

const generatePerformance = (studentId: string): Performance => ({
  _id: faker.string.uuid(),
  studentId,
  subject: faker.helpers.arrayElement(['Mathematics', 'English', 'Science', 'Social Studies']),
  term: '2025-T1',
  score: faker.number.int({ min: 0, max: 100 }),
  date: faker.date.recent({ days: 30 }).toISOString(),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()),
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
})

const generateRiskFlag = (studentId: string): RiskFlag => ({
  _id: faker.string.uuid(),
  studentId,
  level: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
  reasons: faker.helpers.arrayElements([
    'Poor attendance',
    'Declining performance',
    'Socio-economic factors',
    'Behavioral issues'
  ], { min: 1, max: 3 }),
  status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
})

const generateIntervention = (studentId: string): Intervention => ({
  _id: faker.string.uuid(),
  studentId,
  title: faker.helpers.arrayElement([
    'Parent Meeting',
    'Extra Tutoring',
    'Home Visit',
    'Counseling Session',
    'Academic Support'
  ]),
  description: faker.lorem.sentence(),
  assigneeUserId: faker.string.uuid(),
  dueDate: faker.date.future().toISOString(),
  status: faker.helpers.arrayElement(['PLANNED', 'DONE', 'CANCELLED']),
  evidence: faker.helpers.maybe(() => faker.lorem.paragraph()),
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
})

// Generate mock data
const mockUsers = Array.from({ length: 10 }, () => generateUser())
const mockStudents = Array.from({ length: 200 }, () => generateStudent())
const mockAttendance = mockStudents.flatMap(student => 
  Array.from({ length: 30 }, () => generateAttendance(student._id))
)
const mockPerformance = mockStudents.flatMap(student => 
  Array.from({ length: 12 }, () => generatePerformance(student._id))
)
const mockRiskFlags = mockStudents.flatMap(student => 
  faker.helpers.maybe(() => generateRiskFlag(student._id), { probability: 0.4 })
).filter((flag): flag is RiskFlag => Boolean(flag))
const mockInterventions = mockStudents.flatMap(student => 
  faker.helpers.maybe(() => generateIntervention(student._id), { probability: 0.3 })
).filter((intervention): intervention is Intervention => Boolean(intervention))

// Generate notification history
const generateNotificationHistory = (studentId: string): NotificationHistory => ({
  _id: faker.string.uuid(),
  studentId,
  recipient: faker.person.fullName(),
  channel: faker.helpers.arrayElement(['EMAIL', 'SMS', 'PUSH']),
  template: faker.helpers.arrayElement(['Attendance Alert', 'Performance Update', 'Risk Warning', 'General Update']),
  status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'FAILED', 'PENDING']),
  sentAt: faker.date.recent({ days: 30 }).toISOString(),
  deliveredAt: faker.helpers.maybe(() => faker.date.recent({ days: 25 }).toISOString(), { probability: 0.8 }),
})

const mockNotificationHistory = mockStudents.flatMap(student => 
  Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => generateNotificationHistory(student._id))
)

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    
    // For frontend testing, accept any email/password combination
    // Generate a mock admin user for testing
    const mockAdminUser: User = {
      _id: faker.string.uuid(),
      email: email,
      phone: faker.phone.number(),
      name: faker.person.fullName(),
      role: 'ADMIN',
      schoolId: faker.string.uuid(),
      isActive: true,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }
    
    return HttpResponse.json({
      success: true,
      data: { user: mockAdminUser, token: faker.string.alphanumeric(32) },
      message: 'Login successful'
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const userData = await request.json() as any
    const newUser = generateUser(userData.role || 'TEACHER')
    
    return HttpResponse.json<ApiResponse<{ user: User; token: string }>>({
      success: true,
      data: { user: newUser, token: faker.string.alphanumeric(32) },
      message: 'Registration successful'
    })
  }),

  // Dashboard stats
  http.get('/api/dashboard/stats', () => {
    const stats: DashboardStats = {
      totalStudents: mockStudents.length,
      atRiskStudents: mockRiskFlags.filter(f => f.status === 'OPEN').length,
      attendanceRate: 85,
      averagePerformance: 78,
      recentInterventions: mockInterventions.filter(i => i.status === 'PLANNED').length,
      pendingNotifications: 5,
    }
    
    return HttpResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    })
  }),

  // Dashboard widgets
  http.get('/api/dashboard/at-risk-overview', () => {
    const overview: AtRiskOverview = {
      high: mockRiskFlags.filter(f => f.level === 'HIGH' && f.status === 'OPEN').length,
      medium: mockRiskFlags.filter(f => f.level === 'MEDIUM' && f.status === 'OPEN').length,
      low: mockRiskFlags.filter(f => f.level === 'LOW' && f.status === 'OPEN').length,
      total: mockRiskFlags.filter(f => f.status === 'OPEN').length,
    }
    
    return HttpResponse.json<ApiResponse<AtRiskOverview>>({
      success: true,
      data: overview
    })
  }),

  http.get('/api/dashboard/attendance-trend', ({ request }) => {
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    
    const trend: AttendanceTrend[] = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toISOString().split('T')[0],
        rate: faker.number.float({ min: 70, max: 95, fractionDigits: 1 }),
        present: faker.number.int({ min: 15, max: 25 }),
        absent: faker.number.int({ min: 1, max: 5 }),
        excused: faker.number.int({ min: 0, max: 3 }),
      }
    })
    
    return HttpResponse.json<ApiResponse<AttendanceTrend[]>>({
      success: true,
      data: trend
    })
  }),

  http.get('/api/dashboard/performance-trend', ({ request }) => {
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    
    const trend: PerformanceTrend[] = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toISOString().split('T')[0],
        average: faker.number.float({ min: 60, max: 90, fractionDigits: 1 }),
        subject: faker.helpers.arrayElement(['Mathematics', 'English', 'Science', 'Social Studies']),
      }
    })
    
    return HttpResponse.json<ApiResponse<PerformanceTrend[]>>({
      success: true,
      data: trend
    })
  }),

  http.get('/api/dashboard/intervention-pipeline', () => {
    const pipeline: InterventionPipeline = {
      planned: mockInterventions.filter(i => i.status === 'PLANNED').length,
      inProgress: mockInterventions.filter(i => i.status === 'DONE').length,
      completed: mockInterventions.filter(i => i.status === 'CANCELLED').length,
      total: mockInterventions.length,
    }
    
    return HttpResponse.json<ApiResponse<InterventionPipeline>>({
      success: true,
      data: pipeline
    })
  }),

  // Students endpoints
  http.get('/api/students', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const classroomId = url.searchParams.get('classroomId')
    const gender = url.searchParams.get('gender')
    const riskLevel = url.searchParams.get('riskLevel')

    let filteredStudents = mockStudents

    if (search) {
      filteredStudents = filteredStudents.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (classroomId) {
      filteredStudents = filteredStudents.filter(student => student.classroomId === classroomId)
    }

    if (gender) {
      filteredStudents = filteredStudents.filter(student => student.gender === gender)
    }

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

    return HttpResponse.json<PaginatedResponse<Student>>({
      data: paginatedStudents,
      pagination: {
        page,
        limit,
        total: filteredStudents.length,
        pages: Math.ceil(filteredStudents.length / limit)
      }
    })
  }),

  http.get('/api/students/:id', ({ params }) => {
    const student = mockStudents.find(s => s._id === params.id)
    
    if (!student) {
      return HttpResponse.json({
        success: false,
        data: null,
        message: 'Student not found'
      }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
      data: student
    })
  }),

  // Attendance endpoints
  http.get('/api/attendance', ({ request }) => {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const classroomId = url.searchParams.get('classroomId')

    let filteredAttendance = mockAttendance

    if (date) {
      filteredAttendance = filteredAttendance.filter(att => 
        new Date(att.date).toDateString() === new Date(date).toDateString()
      )
    }

    if (classroomId) {
      const classroomStudents = mockStudents.filter(s => s.classroomId === classroomId)
      const studentIds = classroomStudents.map(s => s._id)
      filteredAttendance = filteredAttendance.filter(att => studentIds.includes(att.studentId))
    }

    return HttpResponse.json<ApiResponse<Attendance[]>>({
      success: true,
      data: filteredAttendance
    })
  }),

  // Performance endpoints
  http.get('/api/performance', ({ request }) => {
    const url = new URL(request.url)
    const classroomId = url.searchParams.get('classroomId')
    const subject = url.searchParams.get('subject')

    let filteredPerformance = mockPerformance

    if (classroomId) {
      const classroomStudents = mockStudents.filter(s => s.classroomId === classroomId)
      const studentIds = classroomStudents.map(s => s._id)
      filteredPerformance = filteredPerformance.filter(perf => studentIds.includes(perf.studentId))
    }

    if (subject) {
      filteredPerformance = filteredPerformance.filter(perf => perf.subject === subject)
    }

    return HttpResponse.json<ApiResponse<Performance[]>>({
      success: true,
      data: filteredPerformance
    })
  }),

  // Risk flags endpoints
  http.get('/api/risk-flags', () => {
    return HttpResponse.json<ApiResponse<RiskFlag[]>>({
      success: true,
      data: mockRiskFlags
    })
  }),

  // Interventions endpoints
  http.get('/api/interventions', () => {
    return HttpResponse.json<ApiResponse<Intervention[]>>({
      success: true,
      data: mockInterventions
    })
  }),

  // Notifications endpoints
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const channel = url.searchParams.get('channel')

    let filteredNotifications = mockNotificationHistory

    if (status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === status)
    }

    if (channel) {
      filteredNotifications = filteredNotifications.filter(n => n.channel === channel)
    }

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

    return HttpResponse.json<PaginatedResponse<NotificationHistory>>({
      data: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / limit)
      }
    })
  }),

  // Reports endpoints
  http.get('/api/reports/attendance', () => {
    return HttpResponse.json<ApiResponse<any>>({
      success: true,
      data: { message: 'Attendance report generated' }
    })
  }),

  http.get('/api/reports/performance', () => {
    return HttpResponse.json<ApiResponse<any>>({
      success: true,
      data: { message: 'Performance report generated' }
    })
  }),

  http.get('/api/reports/risk', () => {
    return HttpResponse.json<ApiResponse<any>>({
      success: true,
      data: { message: 'Risk report generated' }
    })
  }),

  // Teacher endpoints
  http.get('/api/teacher/classes', async () => {
    const classes = [
      {
        id: 'class-1',
        name: 'Mathematics Grade 10A',
        time: '9:00 AM',
        studentCount: 28,
        teacherId: 'teacher-1'
      },
      {
        id: 'class-2', 
        name: 'Science Grade 10B',
        time: '11:00 AM',
        studentCount: 25,
        teacherId: 'teacher-1'
      },
      {
        id: 'class-3',
        name: 'English Grade 9A', 
        time: '2:00 PM',
        studentCount: 30,
        teacherId: 'teacher-1'
      }
    ]

    return HttpResponse.json({
      success: true,
      data: classes
    })
  }),

  http.get('/api/teacher/at-risk-students', async () => {
    const atRiskStudents = [
      {
        _id: 'student-1',
        firstName: 'John',
        lastName: 'Doe',
        classroomId: 'Grade 10A',
        riskLevel: 'HIGH',
        reason: 'Multiple absences and declining grades'
      },
      {
        _id: 'student-2', 
        firstName: 'Jane',
        lastName: 'Smith',
        classroomId: 'Grade 10B',
        riskLevel: 'MEDIUM',
        reason: 'Recent grade drop in mathematics'
      },
      {
        _id: 'student-3',
        firstName: 'Mike',
        lastName: 'Johnson',
        classroomId: 'Grade 9A',
        riskLevel: 'LOW',
        reason: 'Occasional tardiness'
      }
    ]

    return HttpResponse.json({
      success: true,
      data: atRiskStudents
    })
  }),

  http.get('/api/teacher/low-score-alerts', async () => {
    const lowScoreAlerts = [
      {
        _id: 'alert-1',
        student: {
          _id: 'student-1',
          firstName: 'John',
          lastName: 'Doe'
        },
        subject: 'Mathematics',
        score: 45
      },
      {
        _id: 'alert-2',
        student: {
          _id: 'student-2',
          firstName: 'Jane', 
          lastName: 'Smith'
        },
        subject: 'Science',
        score: 52
      }
    ]

    return HttpResponse.json({
      success: true,
      data: lowScoreAlerts
    })
  }),

  http.get('/api/teacher/interventions', async () => {
    const interventions = [
      {
        _id: 'intervention-1',
        title: 'Math Tutoring Session',
        student: {
          _id: 'student-1',
          firstName: 'John',
          lastName: 'Doe'
        },
        status: 'PLANNED',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: 'intervention-2',
        title: 'Parent Meeting',
        student: {
          _id: 'student-2',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return HttpResponse.json({
      success: true,
      data: interventions
    })
  }),

  // Parent endpoints
  http.get('/api/parent/children', async () => {
    const children = [
      {
        _id: 'child-1',
        firstName: 'Emma',
        lastName: 'Wilson',
        classroomId: 'Grade 10A',
        attendanceStreak: 15,
        lastTermScore: 85,
        alerts: [
          { type: 'WARNING', message: 'Attendance below 90%' }
        ]
      },
      {
        _id: 'child-2',
        firstName: 'Alex',
        lastName: 'Wilson', 
        classroomId: 'Grade 8B',
        attendanceStreak: 8,
        lastTermScore: 92,
        alerts: []
      }
    ]

    return HttpResponse.json({
      success: true,
      data: children
    })
  }),

  http.get('/api/parent/messages', async () => {
    const messages = [
      {
        _id: 'msg-1',
        title: 'Attendance Alert',
        message: 'Your child Emma has missed 3 days this month. Please ensure regular attendance.',
        type: 'WARNING',
        childName: 'Emma Wilson',
        childId: 'child-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: 'msg-2',
        title: 'Parent-Teacher Meeting',
        message: 'Scheduled meeting on Friday at 3:00 PM to discuss Alex\'s progress.',
        type: 'INFO',
        childName: 'Alex Wilson',
        childId: 'child-2',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    return HttpResponse.json({
      success: true,
      data: messages
    })
  }),

  http.get('/api/parent/children/:childId/attendance', async ({ params }) => {
    const attendance = {
      present: 18,
      absent: 2,
      rate: 90,
      trend: [
        { date: '2024-01-01', rate: 95 },
        { date: '2024-01-02', rate: 90 },
        { date: '2024-01-03', rate: 85 },
        { date: '2024-01-04', rate: 90 },
        { date: '2024-01-05', rate: 88 }
      ]
    }

    return HttpResponse.json({
      success: true,
      data: attendance
    })
  }),

  http.get('/api/parent/children/:childId/performance', async ({ params }) => {
    const performance = {
      subjects: [
        { name: 'Mathematics', score: 85 },
        { name: 'Science', score: 92 },
        { name: 'English', score: 78 },
        { name: 'History', score: 88 }
      ]
    }

    return HttpResponse.json({
      success: true,
      data: performance
    })
  }),
]
