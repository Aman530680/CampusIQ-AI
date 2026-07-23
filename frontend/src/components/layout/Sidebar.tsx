import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Building2, BarChart3,
  Brain, MessageSquare, FileText, Settings, LogOut,
  GraduationCap, ClipboardList, TrendingUp, Shield
} from 'lucide-react'
import { useAuthStore } from '../../store'
import clsx from 'clsx'

const navByRole = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/predictions', icon: Brain, label: 'AI Predictions' },
    { to: '/admin/chatbot', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
  principal: [
    { to: '/principal', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/principal/departments', icon: Building2, label: 'Departments' },
    { to: '/principal/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/principal/placement', icon: TrendingUp, label: 'Placement' },
    { to: '/principal/predictions', icon: Brain, label: 'AI Insights' },
    { to: '/principal/chatbot', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/principal/reports', icon: FileText, label: 'Reports' },
  ],
  faculty: [
    { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/students', icon: Users, label: 'My Students' },
    { to: '/faculty/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/faculty/marks', icon: BookOpen, label: 'Marks' },
    { to: '/faculty/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/faculty/predictions', icon: Brain, label: 'At-Risk Students' },
  ],
  student: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/student/marks', icon: BookOpen, label: 'Marks & GPA' },
    { to: '/student/predictions', icon: Brain, label: 'AI Insights' },
    { to: '/student/placement', icon: TrendingUp, label: 'Placement' },
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = user?.role || 'student'
  const navItems = navByRole[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">CampusIQ AI</p>
            <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span className="text-primary-700 dark:text-primary-400 text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
