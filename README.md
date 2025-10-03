# EduGuard - Proactive Dropout Prevention System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, data-driven platform designed to help educational institutions proactively identify and prevent student dropout through advanced analytics, early warning systems, and automated intervention management.

### Figma UI Design: [Click Here](https://www.figma.com/design/hACT4bbmrQ3VqLkud1xntM/EduGuard?node-id=0-1&t=AuO482VYgGrCe8xM-1)

### Demo video: [Click Here](https://youtu.be/oNuvGJMJltY)

## 🎯 Project Overview

EduGuard addresses the critical challenge of student dropout in educational systems, particularly in rural and peri-urban schools in Rwanda. By leveraging socio-economic data, academic performance metrics, and attendance patterns, the platform provides educators with actionable insights to intervene before students drop out.

### Key Problem Solved
- **High Dropout Rates**: Traditional reactive approaches miss early warning signs
- **Limited Resources**: Schools lack systematic tools for dropout prevention
- **Data Fragmentation**: Student information scattered across multiple systems
- **Late Interventions**: By the time problems are identified, it's often too late

## 🏗️ Architecture

```
EduGuard/
├── frontend/          # React + TypeScript SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── lib/          # Utilities and API client
│   │   └── stores/       # State management
│   └── dist/             # Production build
├── backend/           # Node.js + Express API
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API endpoints
│   ├── middleware/    # Authentication & validation
│   └── utils/         # Helper functions
├── scripts/           # Development utilities
└── docs/             # Documentation
```

## ✨ Features

### 🎓 Student Management
- **Comprehensive Profiles**: Detailed student information including socio-economic data
- **Rwanda-Specific Fields**: Ubudehe levels, district/sector/cell/village addresses
- **Guardian Contacts**: Multiple contact methods with relationship tracking
- **Academic History**: Performance tracking and grade management

### 📊 Risk Assessment Engine
- **Multi-Factor Analysis**: Combines attendance, performance, and socio-economic indicators
- **Automated Risk Scoring**: Real-time calculation of dropout probability
- **Early Warning System**: Proactive alerts for at-risk students
- **Risk Level Classification**: High, Medium, Low risk categorization

### 📈 Analytics & Reporting
- **Dashboard Analytics**: Real-time insights for administrators and teachers
- **Trend Analysis**: Historical data visualization and pattern recognition
- **Custom Reports**: Flexible reporting system for different stakeholders
- **Data Export**: CSV/PDF export capabilities for external analysis

### 🔔 Notification System
- **Multi-Channel Alerts**: Email, SMS, and in-app notifications
- **Parent Communication**: Automated alerts to guardians about student status
- **Role-Based Notifications**: Tailored messages for different user types
- **Escalation Workflows**: Automated escalation for high-risk cases

### 👥 User Management
- **Role-Based Access Control**: Admin, Teacher, and Parent portals
- **User Approval System**: Admin-controlled user registration
- **Permission Management**: Granular access control
- **Audit Trails**: Complete activity logging

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **React Router** - Client-side routing and navigation
- **TanStack Query** - Powerful data synchronization for React
- **Zustand** - Lightweight state management
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Recharts** - Composable charting library

### Backend
- **Node.js** - JavaScript runtime for server-side development
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - Elegant MongoDB object modeling
- **JWT** - Secure authentication with JSON Web Tokens
- **Nodemailer** - Email service integration
- **Bcrypt** - Password hashing and security

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting and consistency
- **MSW** - API mocking for development
- **Jest** - Testing framework
- **Git** - Version control and collaboration

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** 8.0 or higher (or yarn/pnpm)
- **Git** for version control
- **MongoDB** (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gumutonii/eduguard.git
   cd eduguard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp backend/env.example backend/.env
   
   # Edit backend/.env with your configuration
   # Add MongoDB connection string, JWT secret, etc.
   ```

4. **Start Development**
   ```bash
   # Start frontend development server
   npm run dev
   
   # In another terminal, start backend server
   cd backend && npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📱 User Interface

### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Intuitive mobile navigation
- **Accessibility**: WCAG compliant interface
- **Professional UI**: Clean, modern design system

### Key Pages
- **Landing Page**: Project overview and authentication
- **Admin Dashboard**: System-wide analytics and management
- **Teacher Dashboard**: Class-specific insights and tools
- **Student Registration**: Comprehensive student onboarding
- **Student Profiles**: Detailed individual student tracking
- **Notification Center**: Alert management and communication

## 🔒 Security Features

- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **Environment Security**: Sensitive data protection
- **Audit Logging**: Complete activity tracking
- **Security Scripts**: Automated security checks

## 📊 Data Model

### Student Schema
```javascript
{
  personalInfo: {
    firstName: String,
    lastName: String,
    middleName: String,
    age: Number,
    gender: Enum['M', 'F']
  },
  address: {
    district: String,
    sector: String,
    cell: String,
    village: String
  },
  socioEconomic: {
    ubudeheLevel: Number, // 1-4
    hasParents: Boolean,
    guardianType: String,
    familyConflict: Boolean,
    numberOfSiblings: Number,
    parentEducationLevel: String
  },
  academicInfo: {
    classroomId: String,
    enrollmentDate: Date,
    riskLevel: Enum['HIGH', 'MEDIUM', 'LOW']
  }
}
```

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd backend && npm test

# Run security checks
./scripts/security-check.sh
```

## 📈 Performance

- **Frontend**: Optimized bundle size with code splitting
- **Backend**: Efficient database queries with indexing
- **Caching**: Strategic caching for improved performance
- **Monitoring**: Built-in performance tracking

## 🌍 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, AWS S3, etc.)
```

### Backend Deployment
```bash
# Set production environment variables
# Deploy to your preferred platform
# (Heroku, AWS, DigitalOcean, etc.)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: EduGuard Development Team
- **Academic Advisor**: [Advisor Name]
- **Institution**: [Institution Name]

## 📞 Support

For support, email support@eduguard.com or create an issue in this repository.

## 🔮 Roadmap

- [ ] Mobile application development
- [ ] Advanced analytics with machine learning
- [ ] Integration with school management systems
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] API documentation with Swagger
- [ ] Automated testing pipeline

## 🙏 Acknowledgments

- Rwanda Education Board (REB) for educational context
- Open source community for excellent tools and libraries
- Academic advisors for guidance and feedback

---


**EduGuard** - Empowering Education Through Data-Driven Insights
