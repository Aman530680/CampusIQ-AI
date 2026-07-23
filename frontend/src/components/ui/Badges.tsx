import clsx from 'clsx'

interface RiskBadgeProps { level: string; score?: number }

export function RiskBadge({ level, score }: RiskBadgeProps) {
  const cls = level === 'high' ? 'badge-red' : level === 'medium' ? 'badge-yellow' : 'badge-green'
  return (
    <span className={cls}>
      {level.charAt(0).toUpperCase() + level.slice(1)} {score !== undefined && `(${Math.round(score * 100)}%)`}
    </span>
  )
}

interface AttendanceBadgeProps { percentage: number }

export function AttendanceBadge({ percentage }: AttendanceBadgeProps) {
  const cls = percentage >= 75 ? 'badge-green' : percentage >= 65 ? 'badge-yellow' : 'badge-red'
  return <span className={cls}>{percentage.toFixed(1)}%</span>
}

interface CGPABadgeProps { cgpa: number }

export function CGPABadge({ cgpa }: CGPABadgeProps) {
  const cls = cgpa >= 8 ? 'badge-green' : cgpa >= 6 ? 'badge-blue' : cgpa >= 5 ? 'badge-yellow' : 'badge-red'
  return <span className={cls}>{cgpa.toFixed(2)}</span>
}

interface LoadingSpinnerProps { size?: 'sm' | 'md' | 'lg' }

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return (
    <div className="flex items-center justify-center p-8">
      <div className={clsx('border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin', s)} />
    </div>
  )
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">📊</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}
