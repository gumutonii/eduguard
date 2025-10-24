export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER';

export interface User {
  _id: string;
  email: string;
  phone?: string;
  name: string;
  role: Role;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  _id: string;
  name: string;
  grade: string;
  schoolId: string;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  gender?: 'M' | 'F';
  dob?: string;
  schoolId: string;
  classroomId: string;
  guardianContacts: {
    name: string;
    relation: string;
    phone?: string;
    email?: string;
  }[];
  socioEconomic?: {
    distanceToSchoolKm?: number;
    householdSize?: number;
    incomeBracket?: 'LOW' | 'MED' | 'HIGH';
    indicators?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Performance {
  _id: string;
  studentId: string;
  subject: string;
  term: string;
  score: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskFlag {
  _id: string;
  studentId: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export interface Intervention {
  _id: string;
  studentId: string;
  title: string;
  description?: string;
  assigneeUserId?: string;
  dueDate?: string;
  status: 'PLANNED' | 'DONE' | 'CANCELLED';
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
}

export interface NotificationHistory {
  _id: string;
  studentId: string;
  recipient: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  template: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  sentAt: string;
  deliveredAt?: string;
}

export interface NotificationPreference {
  _id: string;
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  language: 'en' | 'rw';
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  role: Role;
  schoolId: string;
  password: string;
  confirmPassword: string;
}

export interface StudentForm {
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  dob: string;
  classroomId: string;
  guardianContacts: {
    name: string;
    relation: string;
    phone?: string;
    email?: string;
  }[];
}

export interface AttendanceForm {
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  notes?: string;
}

export interface PerformanceForm {
  studentId: string;
  subject: string;
  term: string;
  score: number;
  date: string;
  notes?: string;
}

// Dashboard and analytics types
export interface DashboardStats {
  totalStudents: number;
  atRiskStudents: number;
  attendanceRate: number;
  averagePerformance: number;
  recentInterventions: number;
  pendingNotifications: number;
}

export interface AtRiskOverview {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AttendanceTrend {
  date: string;
  rate: number;
  present: number;
  absent: number;
  excused: number;
}

export interface PerformanceTrend {
  date: string;
  average: number;
  subject: string;
}

export interface InterventionPipeline {
  planned: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface RiskSummary {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface StudentFilters {
  search?: string;
  classroomId?: string;
  gender?: 'M' | 'F';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AttendanceFilters {
  date?: string;
  classroomId?: string;
  status?: 'PRESENT' | 'ABSENT' | 'EXCUSED';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    type: 'attendance' | 'performance' | 'socio_economic';
    threshold: number;
    period: string;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  enabled: boolean;
}
