import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store'
import { studentService, attendanceService, predictionService } from '../../services'
import KPICard from '../../components/ui/KPICard'
import { LoadingSpinner, AttendanceBadge } from '../../components/ui/Badges'
import { BookOpen, BarChart2, TrendingUp, Brain, CheckSquare, Award, Github, Flame, Star, Sparkles } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function StudentDashboard() {
  const { user } = useAuthStore()

  // Fetch current student profile
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: studentService.getMe,
    enabled: user?.role === 'student'
  })

  const studentId = student?.id

  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ['student-attendance', studentId],
    queryFn: () => attendanceService.getStudentAttendance(studentId!),
    enabled: !!studentId,
  })

  const { data: prediction, isLoading: predLoading } = useQuery({
    queryKey: ['student-prediction', studentId],
    queryFn: () => predictionService.predict(studentId!),
    enabled: !!studentId,
  })

  if (studentLoading || attLoading || predLoading) return <LoadingSpinner size="lg" />

  const radarData = prediction ? [
    { subject: 'Attendance', value: Math.min((prediction.predicted_cgpa || 0) * 10, 100) },
    { subject: 'CGPA', value: (prediction.predicted_cgpa || 0) * 10 },
    { subject: 'Coding', value: 85 },
    { subject: 'Placement', value: (prediction.placement_probability || 0) * 100 },
    { subject: 'Risk', value: 100 - (prediction.risk_probability || 0) * 100 },
  ] : []

  return (
    <div className="space-y-6">
      
      {/* Student Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl text-white shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-1.5">
            Welcome back, {student?.name || 'Student'}! <Sparkles className="w-5 h-5 text-emerald-400" />
          </h2>
          <p className="text-xs text-indigo-100 mt-1">Here is your academic prediction dashboard powered by machine learning.</p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-indigo-200">Department Stream</p>
          <p className="text-sm font-bold">{student?.department?.name || 'Engineering'}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Predicted CGPA" value={prediction?.predicted_cgpa?.toFixed(2) || '-'} icon={<BookOpen className="w-5 h-5" />} color="blue" />
        <KPICard title="Placement Probability" value={`${Math.round((prediction?.placement_probability || 0) * 100)}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <KPICard title="Risk Level" value={prediction?.risk_level || '-'} icon={<Brain className="w-5 h-5" />} color={prediction?.risk_level === 'high' ? 'red' : prediction?.risk_level === 'medium' ? 'yellow' : 'green'} />
        <KPICard title="Subjects Tracked" value={attendance?.length || 0} icon={<BarChart2 className="w-5 h-5" />} color="purple" />
      </div>

      {/* Charts Row */}
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

      {/* AI Recommendations */}
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

      {/* Portfolio, Goals, Skills and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Skills Trackers */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Core Skill Analysis
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1 text-slate-500">
                <span>Problem Solving / Coding</span>
                <span className="font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-slate-500">
                <span>System Design & Architecture</span>
                <span className="font-bold">70%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-slate-500">
                <span>Quantitative & Mathematics</span>
                <span className="font-bold">90%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* GitHub & LeetCode stats */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
            <Github className="w-4 h-4 text-slate-900 dark:text-white" /> Coding Portfolio Sync
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-500">GitHub Commits</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">342 Commits / Year</span>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="font-semibold text-slate-500">LeetCode Solved</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">126 Problems</span>
            </div>
          </div>
        </div>

        {/* Personal Goals Checklist */}
        <div className="card">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-indigo-500" /> Personal Goals
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-indigo-600" />
              <span className="line-through">Maintain cumulative CGPA &gt; 7.50</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <input type="checkbox" className="rounded border-slate-800 bg-slate-950 text-indigo-600" />
              <span>Complete AWS Certified Practitioner Mock Exam</span>
            </div>
          </div>
        </div>

      </div>

      {/* Subject-wise Attendance Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subject-wise Attendance Details</h3>
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
