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

// Super Admin pages
import { SuperAdminDashboardPage } from '@/pages/admin/SuperAdminDashboardPage'
import { AllSchoolsPage } from '@/pages/admin/AllSchoolsPage'

// Admin pages
import { DashboardPage as AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { StudentDetailPage as AdminStudentDetailPage } from '@/pages/admin/StudentDetailPage'
import { TeachersPage as AdminTeachersPage } from '@/pages/admin/TeachersPage'
import { NotificationsPage as AdminNotificationsPage } from '@/pages/admin/NotificationsPage'
import { SettingsPage as AdminSettingsPage } from '@/pages/admin/SettingsPage'
import { UserApprovalPage } from '@/pages/admin/UserApprovalPage'
import { AdminClassesPage } from '@/pages/admin/AdminClassesPage'
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage'
import { ClassStudentsPage } from '@/pages/admin/ClassStudentsPage'

// Teacher pages
import { TeacherDashboardPage } from '@/pages/teacher/TeacherDashboardPage'
import { TeacherStudentsPage } from '@/pages/teacher/TeacherStudentsPage'
import { TeacherStudentDetailPage } from '@/pages/teacher/TeacherStudentDetailPage'
import { TeacherNotificationsPage } from '@/pages/teacher/TeacherNotificationsPage'
import { TeacherSettingsPage } from '@/pages/teacher/TeacherSettingsPage'
import { StudentRegistrationPage } from '@/pages/teacher/StudentRegistrationPage'
import { TeacherAttendancesPage } from '@/pages/teacher/TeacherAttendancesPage'



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
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="/schools" element={<AllSchoolsPage />} />
          <Route path="/users" element={<AdminTeachersPage />} />
          <Route path="/approvals" element={<UserApprovalPage />} />
          <Route path="/profile" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    )
  }

  if (user?.role === 'ADMIN') {
          return (
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboardPage />} />
                <Route path="/teachers" element={<AdminTeachersPage />} />
                <Route path="/classes" element={<AdminClassesPage />} />
                <Route path="/classes/:id" element={<ClassStudentsPage />} />
                <Route path="/students" element={<AdminStudentsPage />} />
                <Route path="/students/:id" element={<AdminStudentDetailPage />} />
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
          <Route path="/attendance" element={<TeacherAttendancesPage />} />
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
