import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  '/principal/predictions': 'AI Insights',
  '/principal/chatbot': 'AI Assistant',
  '/principal/reports': 'Reports',
  '/faculty': 'Faculty Dashboard',
  '/faculty/students': 'My Students',
  '/faculty/attendance': 'Attendance Management',
  '/faculty/marks': 'Marks Management',
  '/faculty/analytics': 'Analytics',
  '/faculty/predictions': 'At-Risk Students',
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
