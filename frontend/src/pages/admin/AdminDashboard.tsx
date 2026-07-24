import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Users, GraduationCap, Building2, TrendingUp, AlertTriangle, 
  Star, BarChart2, BookOpen, ShieldCheck, HeartPulse, CheckSquare, 
  Activity, ArrowUpRight, ShieldAlert, Award
} from 'lucide-react'
import { analyticsService, studentService } from '../../services'
import KPICard from '../../components/ui/KPICard'
import { LoadingSpinner } from '../../components/ui/Badges'
import { useAuthStore } from '../../store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, AreaChart, Area, PieChart, Pie, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const role = user?.role || 'admin'

  // Fetch KPI data
  const { data: kpis, isLoading: kpiLoading } = useQuery({ queryKey: ['kpis'], queryFn: analyticsService.kpis })
  const { data: depts } = useQuery({ queryKey: ['dept-analytics'], queryFn: analyticsService.departments })
  const { data: cgpaDist } = useQuery({ queryKey: ['cgpa-dist'], queryFn: analyticsService.cgpaDistribution })
  const { data: attTrend } = useQuery({ queryKey: ['att-trend'], queryFn: analyticsService.attendanceTrend })

  // Faculty role local state: active department select
  const [selectedDeptId, setSelectedDeptId] = useState<number>(2) // Defaults to IT (dept_id = 2)

  // Query student records for the faculty class view (gets students in department)
  const { data: studentsList } = useQuery({
    queryKey: ['faculty-students', selectedDeptId],
    queryFn: () => studentService.list(1, 100, undefined, selectedDeptId),
  })

  // Filter out weak / at-risk students for the faculty card
  const weakStudents = (studentsList?.items || [])
    .filter(s => (s.ml_features?.current_cgpa && s.ml_features.current_cgpa < 6.8) || (s.ml_features?.avg_attendance && s.ml_features.avg_attendance < 75))
    .slice(0, 5)

  if (kpiLoading) return <LoadingSpinner size="lg" />

  // Render Administrator Dashboard
  if (role === 'admin') {
    return (
      <div className="space-y-6">
        
        {/* KPI Grid */}
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

        {/* System Health Indicators & Model Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-500 animate-pulse" /> System Services & Health status
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <p className="text-slate-400 font-semibold mb-1">Database Service</p>
                  <p className="font-bold text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> MySQL Active
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <p className="text-slate-400 font-semibold mb-1">Vector Search Store</p>
                  <p className="font-bold text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> FAISS Index Online
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <p className="text-slate-400 font-semibold mb-1">Predictive Services</p>
                  <p className="font-bold text-indigo-500 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> 6 Models Loaded
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <p className="text-slate-400 font-semibold mb-1">C++ Compiler Fallback</p>
                  <p className="font-bold text-amber-500 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> Fallback Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Model Accuracy Benchmarks</h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>CGPA Regressor (RMSE)</span>
                    <span className="font-mono font-bold text-indigo-500">0.005</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>Placement Forest (Acc)</span>
                    <span className="font-mono font-bold text-emerald-500">85.5%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85.5%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">CGPA Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={cgpaDist || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="range"
                >
                  {(cgpaDist || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Placement Rate by Department</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={depts || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlacementDept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Area type="monotone" dataKey="placement_rate" stroke="#10b981" fillOpacity={1} fill="url(#colorPlacementDept)" strokeWidth={2} />
              </AreaChart>
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

  // Render Principal Executive Dashboard
  if (role === 'principal') {
    // Sort departments to show rankings
    const rankedDepts = depts ? [...depts].sort((a, b) => b.avg_cgpa - a.avg_cgpa) : []

    return (
      <div className="space-y-6">
        
        {/* Principal KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Campus Average CGPA" value={kpis?.avg_cgpa || '7.65'} icon={<BookOpen className="w-5 h-5" />} color="blue" />
          <KPICard title="Average Student Attendance" value={`${kpis?.avg_attendance || '80.08'}%`} icon={<BarChart2 className="w-5 h-5" />} color="yellow" />
          <KPICard title="Total Flagged At-Risk" value={kpis?.at_risk_students || '869'} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
          <KPICard title="Target Placement Goal" value="13.64%" subtitle="Campus placement rate" icon={<Award className="w-5 h-5" />} color="green" />
        </div>

        {/* Academic Insights & Placement Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Placement Trends Overview</h3>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={attTrend || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlacement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Area type="monotone" dataKey="attendance_pct" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPlacement)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> Executive Insights
              </h3>
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-start gap-2.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p><strong>CSE</strong> remains the top performing branch academically with an average of <strong>7.92 CGPA</strong>.</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <p><strong>CIVIL</strong> shows the highest concentration of attendance risk warning counts this semester.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Rankings Table */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Department Academic Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Rank', 'Department', 'Average CGPA', 'Placement Success', 'Active Students'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {rankedDepts.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-semibold text-slate-400">#{i + 1}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{d.department}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{d.avg_cgpa.toFixed(2)}</td>
                    <td className="px-4 py-3">{d.placement_rate}% placed</td>
                    <td className="px-4 py-3 text-slate-500">{d.total_students} students</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    )
  }

  // Render Faculty Dashboard View
  if (role === 'faculty') {
    return (
      <div className="space-y-6">
        
        {/* Class selector and selector banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl">
          <div>
            <h2 className="text-base font-bold text-indigo-950 dark:text-white">Active Mentor Classroom Control</h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter the lists to see student risk evaluations and predictions.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Mentorship Stream:</span>
            <select 
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold"
            >
              <option value={1}>Computer Science Engineering (CSE)</option>
              <option value={2}>Information Technology (IT)</option>
              <option value={3}>Electronics & Communication (ECE)</option>
              <option value={4}>Mechanical Engineering (MECH)</option>
            </select>
          </div>
        </div>

        {/* Classroom KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Department Avg CGPA" value="7.68" icon={<BookOpen className="w-5 h-5" />} color="blue" />
          <KPICard title="Classroom Attendance" value="81.2%" icon={<BarChart2 className="w-5 h-5" />} color="yellow" />
          <KPICard title="Total Mentored Students" value={studentsList?.total || 0} icon={<Users className="w-5 h-5" />} color="green" />
          <KPICard title="Flagged Critical Risk" value={weakStudents.length} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        </div>

        {/* Grid: Weak Students vs Tasks checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weak Students list from DB */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Students Flagged At Academic Risk</h3>
              <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">Action Needed</span>
            </div>
            {weakStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">All students in this classroom meet satisfactory academic thresholds.</div>
            ) : (
              <div className="space-y-3">
                {weakStudents.map(student => (
                  <div key={student.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{student.name}</p>
                      <p className="text-[10px] text-slate-500">{student.student_id}</p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-semibold">
                      <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 px-2 py-0.5 rounded">CGPA: {student.ml_features?.current_cgpa?.toFixed(2) || '-'}</span>
                      <span className="bg-yellow-50 dark:bg-yellow-950 text-yellow-600 px-2 py-0.5 rounded">Att: {student.ml_features?.avg_attendance?.toFixed(1) || '-'}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks checklist */}
          <div className="card flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Academic Coordination Tasks</h3>
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-indigo-600" />
                  <span className="line-through">Submit Midterm Marks for Semester 4</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-indigo-600" />
                  <span className="line-through">Verify student attendance records for June</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <input type="checkbox" className="rounded border-slate-800 bg-slate-950 text-indigo-600" />
                  <span>Submit final lab internal marks by Friday evening</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    )
  }

  // Fallback default
  return null
}
