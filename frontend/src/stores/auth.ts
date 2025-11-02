import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { apiClient } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  clearError: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('🔐 Attempting login for:', email);
          const response = await apiClient.login(email, password)
          
          console.log('🔐 Login response:', response);
          
          if (response.success) {
            console.log('✅ Login successful, setting user:', response.data.user);
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              isLoading: false 
            })
          } else {
            throw new Error(response.message || 'Login failed')
          }
        } catch (error) {
          console.error('❌ Login error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiClient.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isAuthenticated: false, error: null })
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        const { isAuthenticated } = get()
        if (!isAuthenticated) return

        try {
          const response = await apiClient.getCurrentUser()
          if (response.success) {
            set({ user: response.data.user })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ user: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
