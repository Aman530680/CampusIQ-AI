import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, Building2, TrendingUp, AlertTriangle, Star, BarChart2, BookOpen } from 'lucide-react'
import { analyticsService } from '../../services'
import KPICard from '../../components/ui/KPICard'
import { LoadingSpinner } from '../../components/ui/Badges'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AdminDashboard() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({ queryKey: ['kpis'], queryFn: analyticsService.kpis })
  const { data: depts } = useQuery({ queryKey: ['dept-analytics'], queryFn: analyticsService.departments })
  const { data: cgpaDist } = useQuery({ queryKey: ['cgpa-dist'], queryFn: analyticsService.cgpaDistribution })
  const { data: attTrend } = useQuery({ queryKey: ['att-trend'], queryFn: analyticsService.attendanceTrend })

  if (kpiLoading) return <LoadingSpinner size="lg" />

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Students" value={kpis?.total_students?.toLocaleString() || 0} icon={<Users className="w-5 h-5" />} color="blue" />
        <KPICard title="Total Faculty" value={kpis?.total_faculty || 0} icon={<GraduationCap className="w-5 h-5" />} color="green" />
        <KPICard title="Departments" value={kpis?.total_departments || 0} icon={<Building2 className="w-5 h-5" />} color="purple" />
        <KPICard title="Placement Rate" value={`${kpis?.placement_rate || 0}%`} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <KPICard title="Avg CGPA" value={kpis?.avg_cgpa || 0} icon={<BookOpen className="w-5 h-5" />} color="blue" />
        <KPICard title="Avg Attendance" value={`${kpis?.avg_attendance || 0}%`} icon={<BarChart2 className="w-5 h-5" />} color="yellow" />
        <KPICard title="At-Risk Students" value={kpis?.at_risk_students || 0} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <KPICard title="Top Performers" value={kpis?.top_performers || 0} subtitle="CGPA ≥ 8.5" icon={<Star className="w-5 h-5" />} color="green" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department CGPA */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Department-wise Avg CGPA</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={depts || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="code" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toFixed(2)} />
              <Bar dataKey="avg_cgpa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Trend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={attTrend || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Line type="monotone" dataKey="attendance_pct" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CGPA Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">CGPA Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cgpaDist || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(cgpaDist || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Placement by Dept */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Placement Rate by Department</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={depts || []} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="code" type="category" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="placement_rate" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Department Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Department', 'Students', 'Avg CGPA', 'Avg Attendance', 'Placement Rate', 'At-Risk'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(depts || []).map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 font-medium">{d.department}</td>
                  <td className="px-3 py-2">{d.total_students}</td>
                  <td className="px-3 py-2">{d.avg_cgpa}</td>
                  <td className="px-3 py-2">{d.avg_attendance}%</td>
                  <td className="px-3 py-2">{d.placement_rate}%</td>
                  <td className="px-3 py-2">
                    <span className={d.at_risk_count > 50 ? 'badge-red' : d.at_risk_count > 20 ? 'badge-yellow' : 'badge-green'}>
                      {d.at_risk_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
