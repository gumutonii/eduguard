// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// API client with authentication
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.loadToken()
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token')
  }

  private setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  private clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken()
        window.location.href = '/auth/login'
        throw new Error('Unauthorized')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean
      message: string
      data: {
        user: any
        token: string
        refreshToken: string
      }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.success) {
      this.setToken(response.data.token)
    }

    return response
  }

  async register(userData: {
    email: string
    password: string
    name: string
    role: string
    phone?: string
    // School details for ADMIN
    schoolName?: string
    schoolDistrict?: string
    schoolSector?: string
    schoolPhone?: string
    schoolEmail?: string
    adminTitle?: string
    // Class selection for TEACHER
    selectedSchool?: string
    selectedClass?: string
    teacherTitle?: string
  }) {
    const response = await this.request<{
      success: boolean
      message: string
      data: {
        user: any
        token: string
        refreshToken: string
      }
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success) {
      this.setToken(response.data.token)
    }

    return response
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      this.clearToken()
    }
  }

  async getCurrentUser() {
    return this.request<{
      success: boolean
      data: { user: any }
    }>('/auth/me')
  }

  async getProfile() {
    return this.request<{
      success: boolean
      data: any
    }>('/users/profile')
  }

  async updateProfile(profileData: {
    name?: string
    phone?: string
    schoolName?: string
    schoolDistrict?: string
    schoolSector?: string
    schoolPhone?: string
    schoolEmail?: string
    className?: string
    classGrade?: string
    classSection?: string
  }) {
    const response = await this.request<{
      success: boolean
      message: string
      data: {
        user: any
        token: string
      }
    }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })

    if (response.success) {
      this.setToken(response.data.token)
    }

    return response
  }

  async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }) {
    return this.request<{
      success: boolean
      message: string
    }>('/users/profile/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/stats')
  }

  async getAtRiskOverview() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/at-risk-overview')
  }

  async getAttendanceTrend(days: number = 30) {
    return this.request<{
      success: boolean
      data: any
    }>(`/dashboard/attendance-trend?days=${days}`)
  }

  async getPerformanceTrend(days: number = 30) {
    return this.request<{
      success: boolean
      data: any
    }>(`/dashboard/performance-trend?days=${days}`)
  }

  async getInterventionPipeline() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/intervention-pipeline')
  }

  // Teacher-specific dashboard methods
  async getTeacherClasses() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/teacher/classes')
  }

  async getTeacherAtRiskStudents() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/teacher/at-risk-students')
  }

  // Students methods
  async getStudents(params: {
    page?: number
    limit?: number
    classroomId?: string
    riskLevel?: string
    gender?: string
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request<{
      success: boolean
      data: any[]
      pagination: any
    }>(`/students?${searchParams.toString()}`)
  }

  async getStudent(id: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/students/${id}`)
  }

  async createStudent(studentData: any) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  }

  async getAttendance(params: { date?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.date) {
      searchParams.append('date', params.date)
    }
    return this.request<{
      success: boolean
      data: any[]
    }>(`/attendance?${searchParams.toString()}`)
  }

  async markAttendance(attendanceRecords: any[]) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/attendance', {
      method: 'POST',
      body: JSON.stringify({ records: attendanceRecords }),
    })
  }

  async getTeacherDashboard() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/teacher')
  }

  // Notifications methods
  async getNotifications(params: {
    page?: number
    limit?: number
    status?: string
    channel?: string
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request<{
      success: boolean
      data: any[]
      pagination: any
    }>(`/notifications?${searchParams.toString()}`)
  }


  async getTeacherLowScoreAlerts() {
    return this.request<{
      success: boolean
      data: any[]
    }>('/dashboard/teacher/low-score-alerts')
  }

  async getTeacherInterventions() {
    return this.request<{
      success: boolean
      data: any[]
    }>('/dashboard/teacher/interventions')
  }

  // Parent notification methods
  async sendParentRiskAlert(data: {
    studentId: string
    riskLevel: string
    riskDescription: string
  }) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/notifications/parent/risk-alert', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async sendParentAttendanceAlert(data: {
    studentId: string
    attendanceData: {
      absentDays: number
      period: string
      attendanceRate: number
    }
  }) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/notifications/parent/attendance-alert', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async sendParentPerformanceAlert(data: {
    studentId: string
    performanceData: {
      declineReason: string
      currentAverage: number
    }
  }) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/notifications/parent/performance-alert', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getStudentGuardianContacts(studentId: string) {
    return this.request<{
      success: boolean
      data: {
        studentName: string
        guardianContacts: Array<{
          name: string
          relation: string
          phone?: string
          email?: string
          isPrimary?: boolean
        }>
      }
    }>(`/notifications/parent/student/${studentId}/contacts`)
  }


  async getStudentAttendance(studentId: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/attendance?studentId=${studentId}`)
  }

  async getStudentPerformance(studentId: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/performance?studentId=${studentId}`)
  }

  async getStudentRiskFlags(studentId: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/risk-flags?studentId=${studentId}`)
  }

  async getStudentInterventions(studentId: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/interventions?studentId=${studentId}`)
  }

  // Schools methods
  async getSchools(params: {
    search?: string
    type?: 'PRIMARY' | 'SECONDARY'
    district?: string
    province?: string
    isPublic?: boolean
    isBoarding?: boolean
    page?: number
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request<{
      success: boolean
      data: any[]
      pagination: any
    }>(`/schools?${searchParams.toString()}`)
  }

  async getSchool(id: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/schools/${id}`)
  }

  // Get schools for teacher registration (simplified list)
  async getSchoolsForRegistration() {
    return this.request<{
      success: boolean
      data: Array<{
        _id: string
        name: string
        district: string
        sector: string
      }>
    }>('/schools/for-registration')
  }

  // Get classes for a specific school
  async getClassesForSchool(schoolName: string) {
    return this.request<{
      success: boolean
      data: Array<{
        _id: string
        className: string
        fullName: string
        capacityStatus: string
      }>
    }>(`/classes/for-school?schoolName=${encodeURIComponent(schoolName)}`)
  }

        async getSchoolStats() {
          return this.request<{
            success: boolean
            data: any
          }>('/schools/stats/overview')
        }


        // Users methods (Admin only)
        async getUsers(params: {
          page?: number
          limit?: number
          search?: string
          role?: string
        } = {}) {
          const searchParams = new URLSearchParams()
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              searchParams.append(key, value.toString())
            }
          })

          return this.request<{
            success: boolean
            data: any[]
            pagination: any
          }>(`/users?${searchParams.toString()}`)
        }

        // Teachers methods (Admin only) - kept for backward compatibility
        async getTeachers(params: {
          page?: number
          limit?: number
          search?: string
        } = {}) {
          return this.getUsers({ ...params, role: 'TEACHER' })
        }

        // Super Admin methods
        async getSystemStats() {
          return this.request<{
            success: boolean
            data: {
              totalUsers: number
              totalSchools: number
              totalStudents: number
              pendingApprovals: number
              activeUsers: number
              userRoles: {
                superAdmin: number
                admin: number
                teacher: number
              }
            }
          }>('/dashboard/system-stats')
        }

        async getAllSchools() {
          return this.request<{
            success: boolean
            data: any[]
          }>('/schools')
        }

        async getAllUsers() {
          return this.request<{
            success: boolean
            data: any[]
            pagination: any
          }>('/users')
        }

        async getSystemRiskSummary() {
          return this.request<{
            success: boolean
            data: {
              totalRisks: number
              criticalRisks: number
              highRisks: number
              mediumRisks: number
              lowRisks: number
              bySchool: any[]
            }
          }>('/dashboard/risk-summary')
        }

        async getPendingApprovals() {
          return this.request<{
            success: boolean
            data: any[]
          }>('/auth/pending-approvals')
        }

        async approveUser(userId: string) {
          return this.request<{
            success: boolean
            message: string
          }>(`/auth/approve-user/${userId}`, {
            method: 'POST'
          })
        }

  async rejectUser(userId: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/auth/reject-user/${userId}`, {
      method: 'POST'
    })
  }

  // Schools methods
  async getDistrictsSectors() {
    return this.request<{
      success: boolean
      data: any
    }>('/schools/districts-sectors')
  }

  async createSchool(schoolData: {
    name: string
    district: string
    sector: string
    schoolType?: string
    phone?: string
    email?: string
    address?: string
    principal?: {
      name?: string
      phone?: string
      email?: string
    }
  }) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>('/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData)
    })
  }

  async updateSchool(id: string, schoolData: any) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schoolData)
    })
  }

  async deleteSchool(id: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/schools/${id}`, {
      method: 'DELETE'
    })
  }

  async getSchoolStatistics(id: string) {
    return this.request<{
      success: boolean
      data: any
    }>(`/schools/${id}/statistics`)
  }

  // Extended API methods for new features

  // Attendance API

  async getAttendanceSummary(studentId: string, startDate: string, endDate: string) {
    return this.request<{ success: boolean; data: any }>(
      `/attendance/summary/${studentId}?startDate=${startDate}&endDate=${endDate}`
    )
  }

  async getAttendanceCalendar(studentId: string, month: number, year: number) {
    return this.request<{ success: boolean; data: any[] }>(
      `/attendance/calendar?studentId=${studentId}&month=${month}&year=${year}`
    )
  }

  // Performance API
  async addPerformance(data: any) {
    return this.request<{ success: boolean; data: any }>('/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async importPerformance(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${this.baseURL}/performance/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    }).then(res => res.json())
  }

  async getPerformanceSummary(studentId: string, academicYear: string, term: string) {
    return this.request<{ success: boolean; data: any }>(
      `/performance/summary/${studentId}?academicYear=${academicYear}&term=${term}`
    )
  }

  // Risk Flags API
  async getRiskFlags(params: any = {}) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/risk-flags?${searchParams}`)
  }

  async createRiskFlag(data: any) {
    return this.request<{ success: boolean; data: any }>('/risk-flags', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async resolveRiskFlag(id: string, resolutionNotes: string) {
    return this.request<{ success: boolean; data: any }>(`/risk-flags/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes }),
    })
  }

  async detectRisksForStudent(studentId: string) {
    return this.request<{ success: boolean; data: any }>(`/risk-flags/detect/${studentId}`, {
      method: 'POST',
    })
  }

  async getRiskSummary() {
    return this.request<{ success: boolean; data: any }>('/risk-flags/summary')
  }

  // Interventions API
  async getInterventions(params: any = {}) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/interventions?${searchParams}`)
  }

  async getIntervention(id: string) {
    return this.request<{ success: boolean; data: any }>(`/interventions/${id}`)
  }

  async createIntervention(data: any) {
    return this.request<{ success: boolean; data: any }>('/interventions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIntervention(id: string, data: any) {
    return this.request<{ success: boolean; data: any }>(`/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async completeIntervention(id: string, data: any) {
    return this.request<{ success: boolean; data: any }>(`/interventions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async addInterventionNote(id: string, content: string) {
    return this.request<{ success: boolean; data: any }>(`/interventions/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async getInterventionSummary() {
    return this.request<{ success: boolean; data: any }>('/interventions/dashboard-summary')
  }

  // Classes API
  async getClasses(params: any = {}) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/classes?${searchParams}`)
  }

  async getClass(id: string) {
    return this.request<{ success: boolean; data: any }>(`/classes/${id}`)
  }

  async createClass(classData: {
    className: string
  }) {
    return this.request<{ success: boolean; data: any }>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData)
    })
  }

  async updateClass(id: string, classData: any) {
    return this.request<{ success: boolean; data: any }>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData)
    })
  }

  async deleteClass(id: string) {
    return this.request<{ success: boolean; message: string }>(`/classes/${id}`, {
      method: 'DELETE'
    })
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    })
  }

  async deleteStudent(id: string) {
    return this.request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'DELETE'
    })
  }

  async getClassStudents(id: string) {
    return this.request<{ success: boolean; data: any[] }>(`/classes/${id}/students`)
  }

  // Settings API
  async getSettings() {
    return this.request<{ success: boolean; data: any }>('/settings')
  }

  async updateRiskRules(riskRules: any) {
    return this.request<{ success: boolean; data: any }>('/settings/risk-rules', {
      method: 'PUT',
      body: JSON.stringify({ riskRules }),
    })
  }

  async updateNotificationTemplates(notificationTemplates: any) {
    return this.request<{ success: boolean; data: any }>('/settings/notification-templates', {
      method: 'PUT',
      body: JSON.stringify({ notificationTemplates }),
    })
  }

  // Messages API
  async getMessages(params: any = {}) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/messages?${searchParams}`)
  }

  async sendMessage(data: any) {
    return this.request<{ success: boolean; data: any }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async sendBulkMessages(data: any) {
    return this.request<{ success: boolean; data: any }>('/messages/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMessageStats() {
    return this.request<{ success: boolean; data: any }>('/messages/statistics')
  }

  // Reports API
  async getAttendanceReport(params: any) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/reports/attendance?${searchParams}`)
  }

  async getPerformanceReport(params: any) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/reports/performance?${searchParams}`)
  }

  async getRiskReport(params: any) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/reports/risk?${searchParams}`)
  }

  async getInterventionReport(params: any) {
    const searchParams = new URLSearchParams(params)
    return this.request<{ success: boolean; data: any[] }>(`/reports/interventions?${searchParams}`)
  }

  async getDashboardReport() {
    return this.request<{ success: boolean; data: any }>('/reports/dashboard')
  }

  // Student CSV Import/Export
  async exportStudents() {
    return fetch(`${this.baseURL}/students/export`, {
      headers: { Authorization: `Bearer ${this.token}` },
    }).then(res => res.blob())
  }

  async importStudents(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${this.baseURL}/students/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    }).then(res => res.json())
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
