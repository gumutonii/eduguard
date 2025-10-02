# EduGuard Pages Structure

This directory contains all the page components organized by user roles for better maintainability and role-based access control.

## Folder Structure

```
pages/
├── admin/           # Admin-specific pages
│   ├── DashboardPage.tsx
│   ├── StudentsPage.tsx
│   ├── StudentDetailPage.tsx
│   ├── NotificationsPage.tsx
│   └── SettingsPage.tsx
├── teacher/         # Teacher-specific pages
│   ├── TeacherDashboardPage.tsx
│   ├── TeacherStudentsPage.tsx
│   ├── TeacherStudentDetailPage.tsx
│   ├── TeacherNotificationsPage.tsx
│   └── TeacherSettingsPage.tsx
├── parent/          # Parent-specific pages
│   ├── ParentDashboardPage.tsx
│   ├── ParentReportPage.tsx
│   ├── ParentNotificationsPage.tsx
│   └── ParentSettingsPage.tsx
├── auth/            # Authentication pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ForgotPasswordPage.tsx
└── [shared pages]   # Shared components like LandingPage.tsx
```

## Role-Based Routing

The application uses role-based routing in `App.tsx`:

- **ADMIN**: Full access to all admin features (dashboard, students, notifications, profile)
- **TEACHER**: Access to teacher-specific features (dashboard, students, notifications, profile)
- **PARENT**: Parent portal access (dashboard, report, notifications, profile)

**Note**: Students do not have user accounts or dashboard access. Student data is managed by admins and teachers, and parents can view their children's information.

## Navigation by Role

The sidebar navigation is dynamically generated based on user role:

- **ADMIN/TEACHER**: Dashboard, Students, Notifications, Profile
- **PARENT**: Dashboard, Report, Notifications, Profile

## Benefits

1. **Clear Separation**: Each role has its own set of pages
2. **Maintainability**: Easy to modify role-specific features
3. **Scalability**: Simple to add new roles or features
4. **Type Safety**: Each page is properly typed for its role
5. **Code Reusability**: Shared components can be imported across roles
6. **Role-Appropriate Access**: Students don't have accounts, while admins have full access

## Usage

Each role folder contains pages that are automatically routed based on the user's role in the authentication store. The routing logic in `App.tsx` handles the role-based navigation.
