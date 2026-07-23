import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Download } from 'lucide-react'
import { studentService, reportService } from '../../services'
import DataTable from '../../components/ui/DataTable'
import { CGPABadge, AttendanceBadge, RiskBadge } from '../../components/ui/Badges'
import type { Student } from '../../types'

export default function StudentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => studentService.list(page, 20, search || undefined),
  })

  const downloadPdf = async (studentId: number) => {
    const blob = await reportService.studentPdf(studentId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `student_${studentId}_report.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'current_semester', label: 'Semester' },
    {
      key: 'ml_features.current_cgpa', label: 'CGPA',
      render: (row: Student) => row.ml_features ? <CGPABadge cgpa={row.ml_features.current_cgpa} /> : '-'
    },
    {
      key: 'ml_features.avg_attendance', label: 'Attendance',
      render: (row: Student) => row.ml_features ? <AttendanceBadge percentage={row.ml_features.avg_attendance} /> : '-'
    },
    {
      key: 'ml_features.risk_score', label: 'Risk',
      render: (row: Student) => row.ml_features ? <RiskBadge level={row.ml_features.risk_score >= 0.6 ? 'high' : row.ml_features.risk_score >= 0.3 ? 'medium' : 'low'} /> : '-'
    },
    {
      key: 'actions', label: 'Actions',
      render: (row: Student) => (
        <button onClick={() => downloadPdf(row.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Download Report">
          <Download className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 w-64"
              placeholder="Search students..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
            />
          </div>
          <button onClick={() => { setSearch(searchInput); setPage(1) }} className="btn-primary">Search</button>
          {search && <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }} className="btn-secondary">Clear</button>}
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        total={data?.total}
        page={page}
        pages={data?.pages}
        onPageChange={setPage}
        loading={isLoading}
      />
    </div>
  )
}
