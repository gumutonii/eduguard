# EduGuard - Proactive Dropout Prevention System

A comprehensive platform to help schools proactively reduce student dropout by tracking attendance, performance, and socio-economic indicators, generating early-warning risk flags, and prompting timely interventions.

## Project Structure

```
/EduGuard
  /frontend   # React + TypeScript + Tailwind (Phase 1)
  /backend    # Node.js + Express + MongoDB (Phase 2)
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Frontend Features

- **Role-based Access**: Admin and Teacher portals with automated parent notifications
- **Student Management**: Comprehensive student profiles and tracking
- **Attendance Tracking**: Daily attendance with patterns and alerts
- **Performance Monitoring**: Academic performance tracking and analysis
- **Risk Management**: Early warning system with automated risk flags
- **Intervention Tracking**: Structured intervention management
- **Reports & Analytics**: Comprehensive reporting and data export
- **Parent Notifications**: Automated email and SMS alerts to parents when students are at risk

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Zustand for state management
- MSW for API mocking
- Recharts for data visualization

### Backend (Phase 2)
- Node.js + Express
- MongoDB for data storage
- JWT for authentication

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:5173

## License

MIT
