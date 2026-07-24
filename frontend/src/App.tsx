import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore, useThemeStore } from './store'
import { useEffect } from 'react'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/StudentsPage'
import SettingsPage from './pages/admin/SettingsPage'
import ChatbotPage from './pages/admin/ChatbotPage'
import PredictionsPage from './pages/admin/PredictionsPage'
import StudentDashboard from './pages/student/StudentDashboard'
import FacultyPage from './pages/admin/FacultyPage'
import DepartmentsPage from './pages/admin/DepartmentsPage'
import LandingPage from './pages/LandingPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isDark } = useThemeStore()
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark) }, [isDark])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LandingPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="reports" element={<div className="card"><p className="text-gray-500">Reports module - use the download buttons in student/department views</p></div>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="faculty" element={<FacultyPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
      </Route>

      {/* Principal Routes */}
      <Route path="/principal" element={<ProtectedRoute roles={['principal', 'admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="placement" element={<AdminDashboard />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="reports" element={<div className="card"><p>Reports</p></div>} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={<ProtectedRoute roles={['faculty', 'admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="attendance" element={<div className="card"><p>Attendance upload</p></div>} />
        <Route path="marks" element={<div className="card"><p>Marks upload</p></div>} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="predictions" element={<PredictionsPage />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute roles={['student', 'admin']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentDashboard />} />
        <Route path="marks" element={<StudentDashboard />} />
        <Route path="predictions" element={<StudentDashboard />} />
        <Route path="placement" element={<StudentDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
