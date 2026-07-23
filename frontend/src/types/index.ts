export interface User {
  id: number
  email: string
  username: string
  role: 'admin' | 'principal' | 'faculty' | 'student'
  is_active: boolean
}

export interface AuthState {
  user: User | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
}

export interface Student {
  id: number
  student_id: string
  name: string
  email: string
  department_id: number
  batch_year: number
  current_semester: number
  gender?: string
  phone?: string
  admission_type?: string
  category?: string
  is_active: boolean
  department?: Department
  ml_features?: MLFeatures
}

export interface Department {
  id: number
  name: string
  code: string
  hod_name?: string
  established_year?: number
  total_seats: number
}

export interface Faculty {
  id: number
  faculty_id: string
  name: string
  email: string
  department_id: number
  designation?: string
  specialization?: string
  experience_years: number
  is_active: boolean
}

export interface MLFeatures {
  avg_attendance: number
  avg_internal_marks: number
  avg_external_marks: number
  current_cgpa: number
  total_backlogs: number
  subjects_failed: number
  attendance_trend: number
  marks_trend: number
  internship_count: number
  certifications_count: number
  coding_score: number
  extra_curricular_score: number
  risk_score: number
  placement_probability: number
}

export interface AttendanceSummary {
  student_id: number
  student_name: string
  subject_name: string
  total_classes: number
  attended: number
  percentage: number
  status: 'safe' | 'warning' | 'critical'
}

export interface Prediction {
  id: number
  student_id: number
  prediction_type: string
  predicted_value?: number
  confidence?: number
  risk_level?: string
  shap_values?: Record<string, number>
  feature_importance?: Record<string, number>
  recommendations?: string[]
  created_at: string
}

export interface InstitutionKPI {
  total_students: number
  total_faculty: number
  total_departments: number
  avg_cgpa: number
  avg_attendance: number
  placement_rate: number
  at_risk_students: number
  top_performers: number
}

export interface DepartmentAnalytics {
  department: string
  code: string
  total_students: number
  avg_cgpa: number
  avg_attendance: number
  placement_rate: number
  at_risk_count: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
