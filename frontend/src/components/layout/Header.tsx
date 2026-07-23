import { Bell, Moon, Sun, Search } from 'lucide-react'
import { useThemeStore, useAuthStore } from '../../store'

interface Props { title: string }

export default function Header({ title }: Props) {
  const { isDark, toggle } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-64 text-sm" placeholder="Search students, faculty..." />
        </div>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {isDark ? <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{user?.username?.[0]?.toUpperCase()}</span>
        </div>
      </div>
    </header>
  )
}
