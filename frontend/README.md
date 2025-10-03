# EduGuard Frontend

A comprehensive React + TypeScript frontend for the EduGuard Proactive Dropout Prevention System.

## Features

- **Role-based Access**: Admin and Teacher portals
- **Student Management**: Comprehensive student profiles and tracking
- **Attendance Tracking**: Daily attendance with patterns and alerts
- **Performance Monitoring**: Academic performance tracking and analysis
- **Risk Management**: Early warning system with automated risk flags
- **Intervention Tracking**: Structured intervention management
- **Reports & Analytics**: Comprehensive reporting and data export

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **MSW** for API mocking
- **Recharts** for data visualization
- **React Hook Form** + **Zod** for forms and validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Scripts

```bash
# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Project Structure

```
src/
├── app/                 # Routes and layout components
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (sidebar, topbar)
│   └── ui/            # Basic UI primitives (Button, Card, Badge)
├── features/           # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API client
│   ├── api.ts         # API client setup
│   ├── msw.ts         # MSW setup
│   ├── handlers.ts    # MSW handlers
│   └── utils.ts       # Utility functions
├── stores/             # Zustand stores
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── pages/              # Page components
    ├── auth/           # Authentication pages
    └── ...             # Other pages
```

## API Mocking

The application uses MSW (Mock Service Worker) for API mocking during development. Mock data includes:

- **Users**: Admin, Teacher, and Parent accounts
- **Students**: 50+ students with realistic data
- **Attendance**: Daily attendance records
- **Performance**: Academic scores across subjects
- **Risk Flags**: Automated risk assessments
- **Interventions**: Support actions and tracking

### Demo Credentials

- **Admin**: admin@eduguard.com / password
- **Teacher**: teacher@eduguard.com / password  
- **Parent**: parent@eduguard.com / password

## Color Scheme

The application uses a limited color palette for accessibility:

- **Primary**: Indigo (#6366f1) - Main brand color
- **Neutral**: Slate (#64748b) - Text and backgrounds
- **Accent**: Green (#22c55e) - Success and positive actions

## Accessibility

- WCAG AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Semantic HTML structure

## Performance

- Optimized bundle size
- Lazy loading for routes
- Efficient state management
- Minimal re-renders

## Testing

- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Component testing
- **E2E Tests**: Playwright for critical user flows

## Deployment

The application is built as a static site and can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## Backend Integration

When ready to connect to a real backend:

1. Update `src/lib/api.ts` with your API base URL
2. Replace MSW handlers with real API calls
3. Update authentication flow
4. Configure CORS settings

## Contributing

1. Follow the established code style
2. Write tests for new features
3. Update documentation
4. Ensure accessibility compliance

## License

MIT
