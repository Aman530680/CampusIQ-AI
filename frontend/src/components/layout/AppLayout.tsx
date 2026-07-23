import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/students': 'Student Management',
  '/admin/faculty': 'Faculty Management',
  '/admin/departments': 'Departments',
  '/admin/analytics': 'Institution Analytics',
  '/admin/predictions': 'AI Predictions',
  '/admin/chatbot': 'AI Assistant',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/principal': 'Principal Dashboard',
  '/principal/analytics': 'Analytics',
  '/principal/placement': 'Placement Analytics',
  '/faculty': 'Faculty Dashboard',
  '/faculty/students': 'My Students',
  '/faculty/attendance': 'Attendance Management',
  '/faculty/marks': 'Marks Management',
  '/student': 'Student Dashboard',
  '/student/attendance': 'My Attendance',
  '/student/marks': 'My Marks & GPA',
  '/student/predictions': 'AI Insights',
  '/student/placement': 'Placement Readiness',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'CampusIQ AI'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
