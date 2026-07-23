import api from './api'
import type { InstitutionKPI, DepartmentAnalytics, PaginatedResponse, Student, AttendanceSummary, Prediction } from '../types'

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
  logout: () => { localStorage.clear() },
}

export const studentService = {
  list: (page = 1, size = 20, search?: string, department_id?: number) =>
    api.get<PaginatedResponse<Student>>('/students', { params: { page, size, search, department_id } }).then(r => r.data),
  get: (id: number) => api.get<Student>(`/students/${id}`).then(r => r.data),
  create: (data: Partial<Student>) => api.post<Student>('/students', data).then(r => r.data),
  update: (id: number, data: Partial<Student>) => api.put<Student>(`/students/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/students/${id}`).then(r => r.data),
}

export const analyticsService = {
  kpis: () => api.get<InstitutionKPI>('/analytics/kpis').then(r => r.data),
  departments: () => api.get<DepartmentAnalytics[]>('/analytics/departments').then(r => r.data),
  cgpaDistribution: () => api.get<{ range: string; count: number }[]>('/analytics/cgpa-distribution').then(r => r.data),
  attendanceTrend: () => api.get<{ month: string; attendance_pct: number }[]>('/analytics/attendance-trend').then(r => r.data),
  placement: () => api.get('/analytics/placement').then(r => r.data),
  semesterPerformance: () => api.get('/analytics/semester-performance').then(r => r.data),
}

export const attendanceService = {
  getStudentAttendance: (studentId: number) =>
    api.get<AttendanceSummary[]>(`/attendance/student/${studentId}`).then(r => r.data),
}

export const predictionService = {
  predict: (studentId: number) => api.post(`/predictions/student/${studentId}`).then(r => r.data),
  history: (studentId: number) => api.get<Prediction[]>(`/predictions/student/${studentId}/history`).then(r => r.data),
  atRisk: (threshold = 0.6) => api.get('/predictions/at-risk', { params: { threshold } }).then(r => r.data),
}

export const chatbotService = {
  chat: (message: string, session_id?: string) =>
    api.post('/chatbot/chat', { message, session_id }).then(r => r.data),
}

export const reportService = {
  studentPdf: (studentId: number) =>
    api.get(`/reports/student/${studentId}/pdf`, { responseType: 'blob' }).then(r => r.data),
  departmentExcel: (deptId: number) =>
    api.get(`/reports/department/${deptId}/excel`, { responseType: 'blob' }).then(r => r.data),
  institutionExcel: () =>
    api.get('/reports/institution/excel', { responseType: 'blob' }).then(r => r.data),
}

export const adminService = {
  importDataset: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/admin/import-dataset', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  trainModels: () => api.post('/admin/train-models').then(r => r.data),
}

export const departmentService = {
  list: () => api.get('/departments').then(r => r.data),
  get: (id: number) => api.get(`/departments/${id}`).then(r => r.data),
}

export const facultyService = {
  list: (department_id?: number) => api.get('/faculty', { params: { department_id } }).then(r => r.data),
}
