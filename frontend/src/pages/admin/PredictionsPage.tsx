import { useQuery } from '@tanstack/react-query'
import { predictionService } from '../../services'
import { RiskBadge, LoadingSpinner } from '../../components/ui/Badges'
import { AlertTriangle, Brain } from 'lucide-react'

export default function PredictionsPage() {
  const { data: atRisk, isLoading } = useQuery({
    queryKey: ['at-risk'],
    queryFn: () => predictionService.atRisk(0.5),
  })

  if (isLoading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Risk Predictions</h2>
          <p className="text-sm text-gray-500">Students identified as academically at-risk by ML models</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">At-Risk Students ({atRisk?.length || 0})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Student ID', 'Name', 'CGPA', 'Attendance', 'Risk Score', 'Risk Level'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(atRisk || []).map((s: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{s.student_id}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.cgpa}</td>
                  <td className="px-4 py-3">{s.attendance}%</td>
                  <td className="px-4 py-3">{Math.round(s.risk_score * 100)}%</td>
                  <td className="px-4 py-3"><RiskBadge level={s.risk_level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
