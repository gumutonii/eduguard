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
    schoolId: string
    phone?: string
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

        async getSchoolStats() {
          return this.request<{
            success: boolean
            data: any
          }>('/schools/stats/overview')
        }

        // Profile methods
        async updateProfile(profileData: {
          name?: string
          phone?: string
          schoolId?: string
        }) {
          return this.request<{
            success: boolean
            message: string
            data: { user: any }
          }>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
          })
        }

        // Teachers methods (Admin only)
        async getTeachers(params: {
          page?: number
          limit?: number
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
          }>(`/auth/teachers?${searchParams.toString()}`)
        }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
