import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AppLayout } from '@/components/layout/AppLayout'

// Public pages - loaded immediately
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'
import { TermsConditions } from '@/pages/TermsConditions'

// Lazy load pages for code splitting
// Super Admin pages
const SuperAdminDashboardPage = lazy(() => import('@/pages/admin/SuperAdminDashboardPage').then(m => ({ default: m.SuperAdminDashboardPage })))
const AllSchoolsPage = lazy(() => import('@/pages/admin/AllSchoolsPage').then(m => ({ default: m.AllSchoolsPage })))
const SchoolDetailPage = lazy(() => import('@/pages/admin/SchoolDetailPage').then(m => ({ default: m.SchoolDetailPage })))
const AllUsersPage = lazy(() => import('@/pages/admin/AllUsersPage').then(m => ({ default: m.AllUsersPage })))
const UserDetailPage = lazy(() => import('@/pages/admin/UserDetailPage').then(m => ({ default: m.UserDetailPage })))
const UserEditPage = lazy(() => import('@/pages/admin/UserEditPage').then(m => ({ default: m.UserEditPage })))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminStudentDetailPage = lazy(() => import('@/pages/admin/StudentDetailPage').then(m => ({ default: m.StudentDetailPage })))
const AdminTeachersPage = lazy(() => import('@/pages/admin/TeachersPage').then(m => ({ default: m.TeachersPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage').then(m => ({ default: m.AdminNotificationsPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))
const UserApprovalPage = lazy(() => import('@/pages/admin/UserApprovalPage').then(m => ({ default: m.UserApprovalPage })))
const AdminClassesPage = lazy(() => import('@/pages/admin/AdminClassesPage').then(m => ({ default: m.AdminClassesPage })))
const AdminStudentsPage = lazy(() => import('@/pages/admin/AdminStudentsPage').then(m => ({ default: m.AdminStudentsPage })))
const ClassStudentsPage = lazy(() => import('@/pages/admin/ClassStudentsPage').then(m => ({ default: m.ClassStudentsPage })))
const AssignTeacherPage = lazy(() => import('@/pages/admin/AssignTeacherPage').then(m => ({ default: m.AssignTeacherPage })))
const MessagesPage = lazy(() => import('@/pages/admin/MessagesPage').then(m => ({ default: m.MessagesPage })))
const RiskFlagsPage = lazy(() => import('@/pages/admin/RiskFlagsPage').then(m => ({ default: m.RiskFlagsPage })))

// Teacher pages
const TeacherDashboardPage = lazy(() => import('@/pages/teacher/TeacherDashboardPage').then(m => ({ default: m.TeacherDashboardPage })))
const TeacherStudentsPage = lazy(() => import('@/pages/teacher/TeacherStudentsPage').then(m => ({ default: m.TeacherStudentsPage })))
const TeacherStudentDetailPage = lazy(() => import('@/pages/teacher/TeacherStudentDetailPage').then(m => ({ default: m.TeacherStudentDetailPage })))
const TeacherNotificationsPage = lazy(() => import('@/pages/teacher/TeacherNotificationsPage').then(m => ({ default: m.TeacherNotificationsPage })))
const TeacherSettingsPage = lazy(() => import('@/pages/teacher/TeacherSettingsPage').then(m => ({ default: m.TeacherSettingsPage })))
const StudentRegistrationPage = lazy(() => import('@/pages/teacher/StudentRegistrationPage').then(m => ({ default: m.StudentRegistrationPage })))
const ClassAttendancePerformancePage = lazy(() => import('@/pages/teacher/ClassAttendancePerformancePage').then(m => ({ default: m.ClassAttendancePerformancePage })))
const SelectClassPage = lazy(() => import('@/pages/teacher/SelectClassPage').then(m => ({ default: m.SelectClassPage })))
const TeacherRiskFlagsPage = lazy(() => import('@/pages/teacher/TeacherRiskFlagsPage').then(m => ({ default: m.TeacherRiskFlagsPage })))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)



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
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="/schools" element={<AllSchoolsPage />} />
            <Route path="/schools/:schoolId" element={<SchoolDetailPage />} />
            <Route path="/classes/:id" element={<ClassStudentsPage />} />
            <Route path="/users" element={<AllUsersPage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />
            <Route path="/users/:userId/edit" element={<UserEditPage />} />
            <Route path="/students" element={<AdminStudentsPage />} />
            <Route path="/students/:id" element={<AdminStudentDetailPage />} />
            <Route path="/approvals" element={<UserApprovalPage />} />
            <Route path="/profile" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    )
  }

  if (user?.role === 'ADMIN') {
    return (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<AdminDashboardPage />} />
            <Route path="/teachers" element={<AdminTeachersPage />} />
            <Route path="/teachers/:userId" element={<UserDetailPage />} />
            <Route path="/classes" element={<AdminClassesPage />} />
            <Route path="/classes/:id" element={<ClassStudentsPage />} />
            <Route path="/classes/:id/assign-teacher" element={<AssignTeacherPage />} />
            <Route path="/students" element={<AdminStudentsPage />} />
            <Route path="/students/:id" element={<AdminStudentDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/risk-flags" element={<RiskFlagsPage />} />
            <Route path="/approvals" element={<UserApprovalPage />} />
            <Route path="/notifications" element={<AdminNotificationsPage />} />
            <Route path="/profile" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    )
  }

  if (user?.role === 'TEACHER') {
    return (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<TeacherDashboardPage />} />
            <Route path="/students" element={<TeacherStudentsPage />} />
            <Route path="/students/:id" element={<TeacherStudentDetailPage />} />
            <Route path="/students/register" element={<StudentRegistrationPage />} />
            <Route path="/attendance-performance" element={<SelectClassPage />} />
            <Route path="/classes/:id/attendance-performance" element={<ClassAttendancePerformancePage />} />
            <Route path="/risk-flags" element={<TeacherRiskFlagsPage />} />
            <Route path="/notifications" element={<TeacherNotificationsPage />} />
            <Route path="/profile" element={<TeacherSettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    )
  }



  // Default fallback
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/students" element={<AdminStudentsPage />} />
          <Route path="/students/:id" element={<AdminStudentDetailPage />} />
          <Route path="/notifications" element={<AdminNotificationsPage />} />
          <Route path="/profile" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}

export default App
