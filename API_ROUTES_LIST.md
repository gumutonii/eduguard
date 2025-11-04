# EduGuard API Routes - Complete List

## Base URL
- **Local**: `http://localhost:3000/api`
- **Production**: `https://your-backend.onrender.com/api`

---

## 🔓 Public Routes (No Authentication Required)

### Health Check
```
GET /api/health
```
**Response**: `{ status: 'OK', message: 'EduGuard API is running', timestamp: '...', database: '...' }`

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Schools (Public)
```
GET /api/schools/districts-sectors
GET /api/schools/for-registration
```

### Classes (Public)
```
GET /api/classes/for-school?schoolId=YOUR_SCHOOL_ID
```

---

## 🔒 Protected Routes (Require JWT Token)

### Authentication (Protected)
```
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/pending-approvals
POST /api/auth/approve-user/:userId
POST /api/auth/reject-user/:userId
PUT  /api/auth/profile
GET  /api/auth/teachers
```

### Users
```
GET    /api/users
GET    /api/users/profile
GET    /api/users/:id
PUT    /api/users/profile
POST   /api/users/profile/upload-picture
PUT    /api/users/:id
PUT    /api/users/:id/password
PUT    /api/users/:id/status
DELETE /api/users/:id
```

### Students
```
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
POST   /api/students/:id/upload-picture
POST   /api/students/:id/risk-flags
PUT    /api/students/:id/risk-flags/:flagId/resolve
POST   /api/students/:id/notes
DELETE /api/students/:id
GET    /api/students/export
POST   /api/students/import
```

### Schools
```
GET    /api/schools
GET    /api/schools/:id
POST   /api/schools
PUT    /api/schools/:id
DELETE /api/schools/:id
GET    /api/schools/:id/statistics
GET    /api/schools/:id/users
GET    /api/schools/:id/classes
```

### Classes
```
GET    /api/classes
GET    /api/classes/:id
GET    /api/classes/:id/students
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id
POST   /api/classes/:id/assign-teacher
GET    /api/classes/school/:schoolName
GET    /api/classes/teacher/my-classes
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/at-risk-overview
GET /api/dashboard/attendance-trend
GET /api/dashboard/performance-trend
GET /api/dashboard/intervention-pipeline
GET /api/dashboard/teacher/classes
GET /api/dashboard/teacher/at-risk-students
GET /api/dashboard/system-stats
GET /api/dashboard/risk-summary
GET /api/dashboard/all-schools
GET /api/dashboard/all-users
GET /api/dashboard/system-risk-summary
GET /api/dashboard/school-admin-stats
GET /api/dashboard/teacher-stats
```

### Attendance
```
GET    /api/attendance
POST   /api/attendance/mark
GET    /api/attendance/summary/:studentId
GET    /api/attendance/calendar
GET    /api/attendance/statistics
PUT    /api/attendance/:id
DELETE /api/attendance/:id
```

### Performance
```
GET    /api/performance
POST   /api/performance
POST   /api/performance/import
GET    /api/performance/summary/:studentId
GET    /api/performance/class-average
GET    /api/performance/drops/:studentId
PUT    /api/performance/:id
DELETE /api/performance/:id
```

### Risk Flags
```
GET    /api/risk-flags
GET    /api/risk-flags/summary
GET    /api/risk-flags/student/:studentId
POST   /api/risk-flags
POST   /api/risk-flags/detect/:studentId
POST   /api/risk-flags/detect-all
PUT    /api/risk-flags/:id/resolve
PUT    /api/risk-flags/:id
DELETE /api/risk-flags/:id
```

### Interventions
```
GET    /api/interventions
GET    /api/interventions/dashboard-summary
GET    /api/interventions/follow-up
GET    /api/interventions/:id
POST   /api/interventions
PUT    /api/interventions/:id
POST   /api/interventions/:id/notes
POST   /api/interventions/:id/complete
DELETE /api/interventions/:id
```

### Messages
```
GET    /api/messages
GET    /api/messages/statistics
POST   /api/messages/send
POST   /api/messages/send-template
POST   /api/messages/send-bulk
POST   /api/messages/:id/retry
GET    /api/messages/pending
POST   /api/messages/process-pending
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications/:id
POST   /api/notifications
PUT    /api/notifications/:id/status
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
```

### Parent Notifications
```
POST /api/notifications/parent/risk-alert
POST /api/notifications/parent/attendance-alert
POST /api/notifications/parent/performance-alert
GET  /api/notifications/parent/student/:studentId/contacts
```

### Reports
```
GET /api/reports/attendance
GET /api/reports/performance
GET /api/reports/risk
GET /api/reports/interventions
GET /api/reports/messages
GET /api/reports/dashboard
```

### Settings
```
GET  /api/settings
PUT  /api/settings/risk-rules
PUT  /api/settings/notification-templates
PUT  /api/settings/academic-calendar
PUT  /api/settings/system-config
PUT  /api/settings/integrations
PUT  /api/settings
```

### Test Routes (Development/Admin)
```
POST /api/test/dropout-detection
GET  /api/test/students
POST /api/test/risk-detection/:studentId
POST /api/test/notify-parents/:studentId
GET  /api/test/risk-flags
GET  /api/test/notifications
PUT  /api/test/students/:id
DELETE /api/test/clear-data
```

---

## 🧪 Quick Test Commands

### Health Check (No Auth)
```bash
curl https://your-backend.onrender.com/api/health
```

### Public Routes
```bash
# Get districts and sectors
curl https://your-backend.onrender.com/api/schools/districts-sectors

# Get schools for registration
curl https://your-backend.onrender.com/api/schools/for-registration
```

### Protected Routes (Require Token)
```bash
# 1. Login to get token
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. Use token in requests
curl https://your-backend.onrender.com/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Notes

- All routes starting with `/api/` require the base URL
- Protected routes require `Authorization: Bearer <token>` header
- POST/PUT requests typically require `Content-Type: application/json`
- File uploads use `multipart/form-data`
- Query parameters can be added to GET requests (e.g., `?page=1&limit=10`)

---

## ✅ Verification

After deployment, test these in order:
1. `/api/health` - Should return 200 OK
2. `/api/schools/districts-sectors` - Should return districts data
3. `/api/auth/login` - Should return token (if you have test users)
4. `/api/users/profile` - Should return user data (with token)

