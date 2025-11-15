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
      console.log('🔑 Making authenticated request to:', url);
    } else {
      console.log('⚠️ Making unauthenticated request to:', url);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log('📡 Response status:', response.status, 'for', url);

    if (!response.ok) {
      console.log('❌ HTTP Error:', response.status, 'for', url);
      
      if (response.status === 401) {
        console.log('🔒 Unauthorized - clearing token and redirecting to login');
        this.clearToken()
        window.location.href = '/auth/login'
        throw new Error('Unauthorized')
      }
      
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('❌ Error details:', errorData);
      } catch (e) {
        console.log('❌ Could not parse error response');
      }
      
      // Create error object with full details for validation errors
      const error = new Error(errorMessage) as any;
      if (errorData) {
        error.errors = errorData.errors || errorData.error || null;
        error.data = errorData;
      }
      throw error;
    }

    const data = await response.json()
    console.log('📊 Response data for', url, ':', data);
    return data
  }

  // Authentication methods
  async login(email: string, password: string) {
    console.log('🔐 API Client: Attempting login for:', email);
    
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

    console.log('🔐 API Client: Login response:', response);

    if (response.success) {
      console.log('🔐 API Client: Setting token:', response.data.token.substring(0, 20) + '...');
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

  async forgotPassword(email: string) {
    return this.request<{
      success: boolean
      message: string
      pin?: string // Only in development
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async verifyPIN(email: string, pin: string) {
    return this.request<{
      success: boolean
      message: string
    }>('/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ email, pin }),
    })
  }

  async resetPassword(email: string, pin: string, password: string) {
    return this.request<{
      success: boolean
      message: string
    }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, pin, password }),
    })
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
    // Get current user ID from auth store
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      throw new Error('No authentication token found')
    }
    
    // Decode token to get user ID
    const payload = JSON.parse(atob(authToken.split('.')[1]))
    const userId = payload.userId || payload._id
    
    return this.request<{
      success: boolean
      message: string
    }>(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData()
    formData.append('profilePicture', file)
    
    const url = `${this.baseURL}/users/profile/upload-picture`
    const headers: Record<string, string> = {}
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upload profile picture')
    }
    
    return response.json()
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

  async downloadStudentReportPDF(studentId: string) {
    const url = `${this.baseURL}/students/${studentId}/report-pdf`
    const token = this.token || localStorage.getItem('auth_token')
    
    // Create a temporary link to download the PDF
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `student-report-${studentId}-${Date.now()}.pdf`)
    
    // Add authorization header via fetch and create blob
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }
    
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    link.href = blobUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
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

  async getAttendance(params: { date?: string; startDate?: string; endDate?: string; classId?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.date) {
      searchParams.append('date', params.date)
    }
    if (params.startDate) {
      searchParams.append('startDate', params.startDate)
    }
    if (params.endDate) {
      searchParams.append('endDate', params.endDate)
    }
    if (params.classId) {
      searchParams.append('classId', params.classId)
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
    }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records: attendanceRecords }),
    })
  }

  async getTeacherDashboard() {
    return this.request<{
      success: boolean
      data: any
    }>('/dashboard/teacher-stats')
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

  async getInAppNotifications(params: {
    page?: number
    limit?: number
    entityType?: string
    type?: string
    isRead?: string
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    return this.request<{
      success: boolean
      data: any[]
      pagination: any
    }>(`/notifications?${searchParams.toString()}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  }

  async markAllNotificationsAsRead() {
    return this.request<{
      success: boolean
      message: string
      data: { count: number }
    }>('/notifications/read-all', {
      method: 'PUT'
    })
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
              totalClasses: number
              atRiskStudents: number
              pendingApprovals: number
              activeUsers: number
              userRoles: {
                superAdmin: number
                admin: number
                teacher: number
              }
              attendance: {
                rate: number
                total: number
                present: number
                absent: number
                excused: number
              }
              performance: {
                averageScore: number
                passingRate: number
                totalRecords: number
              }
              riskFlags: {
                total: number
                critical: number
                high: number
                medium: number
                low: number
              }
              interventions: {
                total: number
                planned: number
                inProgress: number
                completed: number
                cancelled: number
              }
              messages: {
                total: number
                sent: number
                delivered: number
                failed: number
                pending: number
              }
              schoolPerformance: any[]
            }
          }>('/dashboard/system-stats')
        }

        async getAllSchools() {
          return this.request<{
            success: boolean
            data: any[]
          }>('/dashboard/all-schools')
        }

        async getSchoolById(schoolId: string) {
          return this.request<{
            success: boolean
            data: any
          }>(`/schools/${schoolId}`)
        }

        async getSchoolUsers(schoolId: string) {
          return this.request<{
            success: boolean
            data: any[]
          }>(`/schools/${schoolId}/users`)
        }

        async getSchoolClasses(schoolId: string) {
          return this.request<{
            success: boolean
            data: any[]
          }>(`/schools/${schoolId}/classes`)
        }

        async getAllUsers() {
          return this.request<{
            success: boolean
            data: any[]
          }>('/dashboard/all-users')
        }

        async getUserById(userId: string) {
          return this.request<{
            success: boolean
            data: any
          }>(`/users/${userId}`)
        }

        async updateUser(userId: string, userData: any) {
          return this.request<{
            success: boolean
            message: string
            data: any
          }>(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
          })
        }

        async getSystemRiskSummary() {
          return this.request<{
            success: boolean
            data: {
              totalAtRisk: number
              totalRisks: number
              critical: number
              high: number
              medium: number
              low: number
              byType: {
                attendance: number
                performance: number
                behavior: number
                socioeconomic: number
                combined: number
                other: number
              }
            }
          }>('/dashboard/system-risk-summary')
        }

        async getPendingApprovals() {
          return this.request<{
            success: boolean
            data: any[]
          }>('/auth/pending-approvals')
        }

        // School Admin methods
        async getSchoolAdminStats() {
          return this.request<{
            success: boolean
            data: {
              school: {
                name: string
                district: string
                sector: string
              }
              totalTeachers: number
              pendingTeachers: number
              totalStudents: number
              totalClasses: number
              classesWithTeachers: number
              atRiskStudents: number
              attendance: {
                rate: number
                total: number
                present: number
                absent: number
                excused: number
              }
              performance: {
                averageScore: number
                passingRate: number
                totalRecords: number
              }
              riskFlags: {
                total: number
                critical: number
                high: number
                medium: number
                low: number
              }
              interventions: {
                total: number
                planned: number
                inProgress: number
                completed: number
                cancelled: number
              }
              messages: {
                total: number
                sent: number
                delivered: number
                failed: number
                pending: number
              }
              classPerformance: any[]
              teachers: any[]
            }
          }>('/dashboard/school-admin-stats')
        }

        // Teacher methods
        async getTeacherStats() {
          return this.request<{
            success: boolean
            data: {
              teacher: {
                name: string
                email: string
                className: string
                schoolName: string
              }
              totalStudents: number
              atRiskStudentsCount: number
              totalClasses: number
              attendance: {
                rate: number
                total: number
                present: number
                absent: number
                excused: number
              }
              performance: {
                averageScore: number
                passingRate: number
                totalRecords: number
              }
              riskFlags: {
                total: number
                critical: number
                high: number
                medium: number
                low: number
              }
              interventions: {
                total: number
                planned: number
                inProgress: number
                completed: number
                cancelled: number
              }
              messages: {
                total: number
                sent: number
                delivered: number
                failed: number
                pending: number
              }
              classes: any[]
              atRiskStudents: any[]
              lowScoreAlerts: any[]
              teacherInterventions: any[]
            }
          }>('/dashboard/teacher-stats')
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

  // Attendance API
  async createAttendance(data: { studentId: string; date: string; status: string; notes?: string; reason?: string }) {
    return this.request<{ success: boolean; data: any }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records: [data] })
    })
  }

  async updateAttendance(attendanceId: string, data: { status?: string; notes?: string; reason?: string }) {
    return this.request<{ success: boolean; data: any }>(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Performance API
  async createPerformance(data: any) {
    return this.request<{ success: boolean; data: any }>('/performance', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updatePerformance(performanceId: string, data: any) {
    return this.request<{ success: boolean; data: any }>(`/performance/${performanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async addPerformance(data: any) {
    return this.createPerformance(data)
  }

  async bulkCreatePerformance(records: any[]) {
    return this.request<{ success: boolean; data: { created: any[]; updated: any[] }; errors?: any[] }>('/performance/bulk', {
      method: 'POST',
      body: JSON.stringify({ records })
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

  async getPerformance(params: { studentId?: string; classId?: string; term?: string; academicYear?: string } = {}) {
    const searchParams = new URLSearchParams()
    if (params.studentId) searchParams.append('studentId', params.studentId)
    if (params.classId) searchParams.append('classId', params.classId)
    if (params.term) searchParams.append('term', params.term)
    if (params.academicYear) searchParams.append('academicYear', params.academicYear)
    return this.request<{ success: boolean; data: any[] }>(`/performance?${searchParams.toString()}`)
  }

  async getPerformanceSummary(studentId: string, academicYear: string, term: string) {
    return this.request<{ success: boolean; data: any }>(
      `/performance/summary/${studentId}?academicYear=${academicYear}&term=${term}`
    )
  }

  // Risk Flags API
  async getRiskFlags(params: { studentId?: string; type?: string; severity?: string; isActive?: boolean; isResolved?: boolean } = {}) {
    const searchParams = new URLSearchParams()
    if (params.studentId) searchParams.append('studentId', params.studentId)
    if (params.type) searchParams.append('type', params.type)
    if (params.severity) searchParams.append('severity', params.severity)
    if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())
    if (params.isResolved !== undefined) searchParams.append('isResolved', params.isResolved.toString())
    return this.request<{ success: boolean; data: any[] }>(`/risk-flags?${searchParams.toString()}`)
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

  async downloadRiskReportPDF(params: { severity?: string; type?: string; isActive?: string } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    const url = `${this.baseURL}/risk-flags/export-pdf${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const token = this.token || localStorage.getItem('auth_token')
    
    // Create a temporary link to download the PDF
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `risk-report-${Date.now()}.pdf`)
    
    // Add authorization header via fetch and create blob
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }
    
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    link.href = blobUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
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

  async updateStudent(id: string, studentData: any) {
    return this.request<{
      success: boolean
      message: string
      data: any
    }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    })
  }

  async uploadStudentProfilePicture(studentId: string, file: File) {
    const formData = new FormData()
    formData.append('profilePicture', file)
    
    const url = `${this.baseURL}/students/${studentId}/upload-picture`
    const headers: Record<string, string> = {}
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upload profile picture')
    }
    
    return response.json()
  }

  async deleteStudent(id: string) {
    return this.request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'DELETE'
    })
  }

  async getClassStudents(id: string) {
    return this.request<{ success: boolean; data: any[] }>(`/classes/${id}/students`)
  }

  async assignTeacherToClass(classId: string, teacherId: string) {
    return this.request<{ success: boolean; message: string; data: any }>(`/classes/${classId}/assign-teacher`, {
      method: 'POST',
      body: JSON.stringify({ teacherId })
    })
  }

  async getTeacherMyClasses() {
    return this.request<{
      success: boolean
      data: Array<{
        _id: string
        className: string
        name: string
        grade: string
        section: string
        studentCount: number
      }>
    }>('/classes/teacher/my-classes')
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
  async getMessages(params: {
    page?: number
    limit?: number
    status?: string
    channel?: string
    search?: string
    studentId?: string
    type?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return this.request<{
      success: boolean
      data: any[]
      pagination?: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/messages?${searchParams.toString()}`)
  }

  async sendMessage(data: {
    studentId: string
    recipientType?: string
    recipientName?: string
    recipientPhone?: string
    recipientEmail?: string
    channel?: 'SMS' | 'EMAIL' | 'BOTH'
    type?: string
    content: string
    subject?: string
    language?: 'EN' | 'RW'
  }) {
    return this.request<{ success: boolean; data: any }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async sendBulkMessage(data: {
    studentIds: string[]
    content: string
    subject?: string
    channel?: 'SMS' | 'EMAIL' | 'BOTH'
    type?: string
    language?: 'EN' | 'RW'
  }) {
    return this.request<{ 
      success: boolean
      message: string
      sent: number
      failed: number
      results?: any[]
      errors?: any[]
    }>('/messages/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async sendTemplateMessage(data: {
    studentId: string
    templateType: string
    variables?: Record<string, any>
    channel?: 'SMS' | 'EMAIL' | 'BOTH'
  }) {
    return this.request<{ success: boolean; data: any }>('/messages/send-template', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async sendBulkMessages(data: {
    studentIds: string[]
    content: string
    subject?: string
    channel?: 'SMS' | 'EMAIL' | 'BOTH'
    type?: string
  }) {
    return this.request<{ success: boolean; sent: number; failed: number; results: any[]; errors?: any[] }>('/messages/send-bulk', {
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
