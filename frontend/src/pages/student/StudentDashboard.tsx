import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store'
import { analyticsService, attendanceService, predictionService } from '../../services'
import KPICard from '../../components/ui/KPICard'
import { LoadingSpinner, RiskBadge, AttendanceBadge } from '../../components/ui/Badges'
import { BookOpen, BarChart2, TrendingUp, Brain } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  // In real app, get student ID from user profile
  const studentId = 1

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: () => attendanceService.getStudentAttendance(studentId),
  })

  const { data: prediction, isLoading: predLoading } = useQuery({
    queryKey: ['student-prediction', studentId],
    queryFn: () => predictionService.predict(studentId),
  })

  if (attLoading || predLoading) return <LoadingSpinner size="lg" />

  const radarData = prediction ? [
    { subject: 'Attendance', value: Math.min((prediction.predicted_cgpa || 0) * 10, 100) },
    { subject: 'CGPA', value: (prediction.predicted_cgpa || 0) * 10 },
    { subject: 'Coding', value: 60 },
    { subject: 'Placement', value: (prediction.placement_probability || 0) * 100 },
    { subject: 'Risk', value: 100 - (prediction.risk_probability || 0) * 100 },
  ] : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Predicted CGPA" value={prediction?.predicted_cgpa?.toFixed(2) || '-'} icon={<BookOpen className="w-5 h-5" />} color="blue" />
        <KPICard title="Placement Probability" value={`${Math.round((prediction?.placement_probability || 0) * 100)}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <KPICard title="Risk Level" value={prediction?.risk_level || '-'} icon={<Brain className="w-5 h-5" />} color={prediction?.risk_level === 'high' ? 'red' : prediction?.risk_level === 'medium' ? 'yellow' : 'green'} />
        <KPICard title="Subjects Tracked" value={attendance?.length || 0} icon={<BarChart2 className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance by Subject */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attendance by Subject</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendance || []} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject_name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Radar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      {prediction?.recommendations && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">AI Recommendations</h3>
          <div className="space-y-2">
            {prediction.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject-wise Attendance</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Subject', 'Total Classes', 'Attended', 'Percentage', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {(attendance || []).map((a, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{a.subject_name}</td>
                <td className="px-4 py-3">{a.total_classes}</td>
                <td className="px-4 py-3">{a.attended}</td>
                <td className="px-4 py-3"><AttendanceBadge percentage={a.percentage} /></td>
                <td className="px-4 py-3">
                  <span className={a.status === 'safe' ? 'badge-green' : a.status === 'warning' ? 'badge-yellow' : 'badge-red'}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
