import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'
import { TermsConditions } from '@/pages/TermsConditions'

// Admin pages
import { DashboardPage as AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { StudentsPage as AdminStudentsPage } from '@/pages/admin/StudentsPage'
import { StudentDetailPage as AdminStudentDetailPage } from '@/pages/admin/StudentDetailPage'
import { TeachersPage as AdminTeachersPage } from '@/pages/admin/TeachersPage'
import { NotificationsPage as AdminNotificationsPage } from '@/pages/admin/NotificationsPage'
import { SettingsPage as AdminSettingsPage } from '@/pages/admin/SettingsPage'
import { UserApprovalPage } from '@/pages/admin/UserApprovalPage'

// Teacher pages
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherStudentsPage } from '@/pages/teacher/TeacherStudentsPage'
import { TeacherStudentDetailPage } from '@/pages/teacher/TeacherStudentDetailPage'
import { TeacherNotificationsPage } from '@/pages/teacher/TeacherNotificationsPage'
import { TeacherSettingsPage } from '@/pages/teacher/TeacherSettingsPage'
import { StudentRegistrationPage } from '@/pages/teacher/StudentRegistrationPage'



function App() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PublicLayout>
    )
  }

  // Role-based routing
        if (user?.role === 'ADMIN') {
          return (
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboardPage />} />
                <Route path="/students" element={<AdminStudentsPage />} />
                <Route path="/students/:id" element={<AdminStudentDetailPage />} />
                <Route path="/teachers" element={<AdminTeachersPage />} />
                <Route path="/approvals" element={<UserApprovalPage />} />
                <Route path="/notifications" element={<AdminNotificationsPage />} />
                <Route path="/profile" element={<AdminSettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          )
        }

  if (user?.role === 'TEACHER') {
    return (
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<TeacherDashboardPage />} />
          <Route path="/students" element={<TeacherStudentsPage />} />
          <Route path="/students/:id" element={<TeacherStudentDetailPage />} />
          <Route path="/students/register" element={<StudentRegistrationPage />} />
          <Route path="/notifications" element={<TeacherNotificationsPage />} />
          <Route path="/profile" element={<TeacherSettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    )
  }



  // Default fallback
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/students" element={<AdminStudentsPage />} />
        <Route path="/students/:id" element={<AdminStudentDetailPage />} />
        <Route path="/notifications" element={<AdminNotificationsPage />} />
        <Route path="/profile" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
