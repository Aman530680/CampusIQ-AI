import clsx from 'clsx'
import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: number
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
}

export default function KPICard({ title, value, subtitle, icon, trend, color = 'blue' }: KPICardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={clsx('text-xs font-medium mt-2', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
