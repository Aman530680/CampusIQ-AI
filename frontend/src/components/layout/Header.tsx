import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Moon, Sun, Search, User, GraduationCap, Building2, Check, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useThemeStore, useAuthStore } from '../../store'
import { studentService, facultyService, departmentService } from '../../services'

interface Props { title: string }

interface NotificationItem {
  id: string
  title: string
  desc: string
  time: string
  type: 'alert' | 'success' | 'info'
  read: boolean
}

export default function Header({ title }: Props) {
  const { isDark, toggle } = useThemeStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Notification States
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'System Alert', desc: 'XGBoost CGPA Predictor models trained successfully.', time: '2 mins ago', type: 'success', read: false },
    { id: '2', title: 'Attendance Alert', desc: '8 students flagged with attendance below 75% in CSE.', time: '1 hour ago', type: 'alert', read: false },
    { id: '3', title: 'Report Completed', desc: 'IT Department monthly analysis Excel is ready for download.', time: '4 hours ago', type: 'info', read: false },
    { id: '4', title: 'Security Event', desc: 'Admin account logged in from local console.', time: '1 day ago', type: 'success', read: true }
  ])

  // Queries for Global Search
  const { data: studentsData } = useQuery({
    queryKey: ['global-search-students', searchQuery],
    queryFn: () => studentService.list(1, 5, searchQuery || undefined),
    enabled: searchQuery.length > 1
  })

  const { data: facultyData } = useQuery({
    queryKey: ['global-search-faculty'],
    queryFn: () => facultyService.list(),
    enabled: searchQuery.length > 1
  })

  const { data: departmentsData } = useQuery({
    queryKey: ['global-search-departments'],
    queryFn: () => departmentService.list(),
    enabled: searchQuery.length > 1
  })

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter local lists for search matches
  const matchingStudents = studentsData?.items || []
  
  const matchingFaculty = searchQuery.length > 1 && facultyData
    ? facultyData.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : []

  const matchingDepartments = searchQuery.length > 1 && departmentsData
    ? departmentsData.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : []

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleSearchResultClick = (type: string, id: number | string) => {
    setSearchQuery('')
    setShowSearchDropdown(false)
    if (type === 'student') {
      navigate('/admin/students')
    } else if (type === 'faculty') {
      navigate('/admin/faculty')
    } else if (type === 'department') {
      navigate('/admin/departments')
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
      
      <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      
      <div className="flex items-center gap-4">
        
        {/* Global Search Box */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowSearchDropdown(true)
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="input pl-10 w-72 text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 focus:border-indigo-500 rounded-xl" 
              placeholder="Search students, HODs, faculty..." 
            />
          </div>

          <AnimatePresence>
            {showSearchDropdown && searchQuery.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-xl overflow-hidden z-50 p-3 space-y-3"
              >
                {/* Students Matches */}
                {matchingStudents.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">Students</h4>
                    <div className="space-y-1">
                      {matchingStudents.map(student => (
                        <button
                          key={student.id}
                          onClick={() => handleSearchResultClick('student', student.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-[10px] text-slate-400">{student.student_id}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Faculty Matches */}
                {matchingFaculty.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">Faculty</h4>
                    <div className="space-y-1">
                      {matchingFaculty.map((fac: any) => (
                        <button
                          key={fac.id}
                          onClick={() => handleSearchResultClick('faculty', fac.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                          <div>
                            <p className="font-semibold">{fac.name}</p>
                            <p className="text-[10px] text-slate-400">{fac.designation}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departments Matches */}
                {matchingDepartments.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">Departments</h4>
                    <div className="space-y-1">
                      {matchingDepartments.map((dept: any) => (
                        <button
                          key={dept.id}
                          onClick={() => handleSearchResultClick('department', dept.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          <div>
                            <p className="font-semibold">{dept.name}</p>
                            <p className="text-[10px] text-slate-400">{dept.code} Department</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchingStudents.length === 0 && matchingFaculty.length === 0 && matchingDepartments.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No matching results found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark Mode Theme Switcher */}
        <button 
          onClick={toggle} 
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell with Dropdown */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" 
                />
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-xl overflow-hidden z-50 p-1"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-xs font-bold">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead} 
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850/50">
                  {notifications.map(item => {
                    return (
                      <div 
                        key={item.id} 
                        className={`p-3.5 flex gap-3 text-xs transition-colors ${
                          !item.read ? 'bg-slate-50/50 dark:bg-slate-900/40' : 'bg-transparent'
                        }`}
                      >
                        <div className="mt-0.5">
                          {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                          {item.type === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                          {item.type === 'info' && <Check className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                            <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">{item.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-extrabold">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
        </div>

      </div>
    </header>
  )
}
