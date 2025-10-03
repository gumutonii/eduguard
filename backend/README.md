# EduGuard Backend API

A comprehensive backend API for the EduGuard Proactive Dropout Prevention System, built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin and Teacher user roles with automated parent notifications
- **Student Management**: Complete student lifecycle with risk tracking
- **Dashboard Analytics**: Real-time statistics and insights
- **Notification System**: Multi-channel communication (Email, SMS, Push)
- **Security**: Rate limiting, CORS, input validation, password hashing

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **Validation**: express-validator

## 📋 Prerequisites

- Node.js 16 or higher
- MongoDB running on localhost:27017
- npm or yarn package manager

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   mongod
   ```

4. **Seed Database**
   ```bash
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

## 🔧 Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/eduguard

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password
- `PUT /api/users/:id/status` - Activate/Deactivate user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Students
- `GET /api/students` - Get students with filtering
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student (Admin/Teacher)
- `PUT /api/students/:id` - Update student (Admin/Teacher)
- `POST /api/students/:id/risk-flags` - Add risk flag
- `PUT /api/students/:id/risk-flags/:flagId/resolve` - Resolve risk flag
- `POST /api/students/:id/notes` - Add student note
- `DELETE /api/students/:id` - Deactivate student (Admin)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/at-risk-overview` - Get at-risk students overview
- `GET /api/dashboard/attendance-trend` - Get attendance trend data
- `GET /api/dashboard/performance-trend` - Get performance trend data
- `GET /api/dashboard/intervention-pipeline` - Get intervention pipeline data

### Notifications
- `GET /api/notifications` - Get notifications with filtering
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications` - Create notification (Admin/Teacher)
- `PUT /api/notifications/:id/status` - Update notification status
- `DELETE /api/notifications/:id` - Delete notification (Admin)

### Parent Notifications
- `POST /api/notifications/parent/risk-alert` - Send risk alert to parents
- `POST /api/notifications/parent/attendance-alert` - Send attendance alert to parents
- `POST /api/notifications/parent/performance-alert` - Send performance alert to parents
- `GET /api/notifications/parent/student/:studentId/contacts` - Get student guardian contacts

## 👥 User Roles

### Admin
- Full system access
- User management
- Student management
- System configuration

### Teacher
- Classroom management
- Student monitoring
- Risk assessment
- Parent notification triggers

### Parent Notifications
- Automated email alerts when students are at risk
- SMS notifications for critical alerts
- No dashboard access required
- Contact information from student registration

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Configured for frontend origin
- **Input Validation**: express-validator for data validation
- **Helmet**: Security headers
- **Role-based Access**: Granular permission system

## 🗄️ Database Schema

### Users Collection
- Email, password, name, role, schoolId
- Phone, isActive, lastLogin
- Password reset tokens

### Students Collection
- Personal info, classroom, assigned teacher
- Guardian contacts, risk flags, notes
- Risk level assessment

### Schools Collection
- School information and settings
- Academic year configuration
- Risk assessment rules

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 API Documentation

The API follows RESTful conventions and returns JSON responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // For paginated responses
}
```

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // For validation errors
}
```

## 🔄 Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Seed database with test data
npm run seed
```

## 📦 Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up reverse proxy (nginx)
6. Enable SSL/TLS

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details
