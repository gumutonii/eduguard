import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiClient } from '../api'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Methods', () => {
    // Unit Tests
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: { _id: '123', email: 'test@example.com', role: 'ADMIN' },
          token: 'test-token',
          refreshToken: 'test-refresh-token'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.login('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.data.token).toBe('test-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
    })

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Invalid credentials'
        })
      })

      await expect(apiClient.login('test@example.com', 'wrongpassword')).rejects.toThrow()
    })

    it('should successfully register a new user', async () => {
      const mockResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: { _id: '123', email: 'new@example.com', role: 'ADMIN' },
          token: 'test-token'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: 'ADMIN',
        schoolName: 'Test School',
        schoolDistrict: 'Kigali',
        schoolSector: 'Nyarugenge'
      })

      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe('new@example.com')
    })

    it('should handle registration validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Invalid email' }]
        })
      })

      await expect(apiClient.register({
        email: 'invalid',
        password: 'short',
        name: 'Test',
        role: 'ADMIN',
        schoolName: 'Test',
        schoolDistrict: 'Kigali',
        schoolSector: 'Nyarugenge'
      })).rejects.toThrow()
    })

    it('should send forgot password request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset PIN sent to email'
        })
      })

      const result = await apiClient.forgotPassword('test@example.com')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com')
        })
      )
    })

    it('should verify PIN and reset password', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'PIN verified' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Password reset successful' })
        })

      await apiClient.verifyPIN('test@example.com', '12345')
      await apiClient.resetPassword('test@example.com', '12345', 'newpassword123')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Student Methods', () => {
    // Unit Tests
    it('should fetch students list', async () => {
      const mockResponse = {
        success: true,
        data: [
          { _id: '1', firstName: 'John', lastName: 'Doe' },
          { _id: '2', firstName: 'Jane', lastName: 'Smith' }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getStudents()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/students'),
        expect.any(Object)
      )
    })

    it('should fetch single student by ID', async () => {
      const mockResponse = {
        success: true,
        data: { _id: '123', firstName: 'John', lastName: 'Doe' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getStudent('123')

      expect(result.success).toBe(true)
      expect(result.data.firstName).toBe('John')
    })

    it('should create a new student', async () => {
      const mockResponse = {
        success: true,
        data: {
          student: { _id: '123', firstName: 'New', lastName: 'Student' }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.createStudent({
        firstName: 'New',
        lastName: 'Student',
        studentId: 'NEW001',
        gender: 'M',
        dateOfBirth: '2010-01-01',
        schoolId: 'school123',
        socioEconomic: {
          ubudeheLevel: 2,
          hasParents: true,
          familyStability: true
        }
      })

      expect(result.success).toBe(true)
      expect(result.data.student.firstName).toBe('New')
    })

    it('should update student information', async () => {
      const mockResponse = {
        success: true,
        data: { _id: '123', firstName: 'Updated', lastName: 'Student' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.updateStudent('123', {
        firstName: 'Updated'
      })

      expect(result.success).toBe(true)
      expect(result.data.firstName).toBe('Updated')
    })
  })

  describe('Dashboard Methods', () => {
    // Unit Tests
    it('should fetch school admin dashboard statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalStudents: 100,
          totalClasses: 10,
          atRiskStudents: 15,
          performance: { averageScore: 75 }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getSchoolAdminStats()

      expect(result.success).toBe(true)
      expect(result.data.totalStudents).toBe(100)
      expect(result.data.performance.averageScore).toBe(75)
    })

    it('should fetch teacher dashboard statistics', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalStudents: 25,
          atRiskStudents: [],
          classes: []
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getTeacherStats()

      expect(result.success).toBe(true)
      expect(result.data.totalStudents).toBe(25)
    })
  })

  describe('Risk Flags Methods', () => {
    // Unit Tests
    it('should fetch risk flags', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            _id: '1',
            type: 'ATTENDANCE',
            severity: 'HIGH',
            title: 'High Absenteeism'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.getRiskFlags()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].severity).toBe('HIGH')
    })

    it('should resolve a risk flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Risk flag resolved' })
      })

      const result = await apiClient.resolveRiskFlag('flag123', 'Resolved by admin')

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/risk-flags/flag123/resolve'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('Error Handling', () => {
    // Integration Tests
    it('should handle 401 unauthorized and redirect to login', async () => {
      localStorageMock.getItem.mockReturnValue('existing-token')

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: 'Unauthorized' })
      })

      await expect(apiClient.getStudents()).rejects.toThrow('Unauthorized')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getStudents()).rejects.toThrow('Network error')
    })

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(apiClient.getStudents()).rejects.toThrow()
    })
  })

  describe('Token Management', () => {
    // Unit Tests
    it('should load token from localStorage on initialization', () => {
      localStorageMock.getItem.mockReturnValue('stored-token')
      
      // Re-initialize to test token loading
      const ApiClient = require('../api').apiClient.constructor
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
    })

    it('should include token in authenticated requests', async () => {
      localStorageMock.getItem.mockReturnValue('test-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await apiClient.getStudents()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      )
    })

    it('should clear token on logout', () => {
      apiClient.logout()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })
})

