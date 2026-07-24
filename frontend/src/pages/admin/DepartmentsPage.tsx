import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Building2, Download } from 'lucide-react'
import { departmentService, reportService } from '../../services'
import DataTable from '../../components/ui/DataTable'
import type { Department } from '../../types'

export default function DepartmentsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  })

  const downloadExcel = async (deptId: number, deptCode: string) => {
    try {
      const blob = await reportService.departmentExcel(deptId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `department_${deptCode.toLowerCase()}_students_report.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }

  // Filter departments locally by name or HOD
  const filteredData = data.filter(dept => {
    const q = search.toLowerCase()
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      (dept.hod_name && dept.hod_name.toLowerCase().includes(q))
    )
  })

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Department Name' },
    { key: 'hod_name', label: 'HOD Name', render: (row: Department) => row.hod_name || '-' },
    { key: 'established_year', label: 'Established', render: (row: Department) => row.established_year || '-' },
    { key: 'total_seats', label: 'Seat Intake' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Department) => (
        <button 
          onClick={() => downloadExcel(row.id, row.code)} 
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 rounded transition-colors"
          title="Download Student Excel Report"
        >
          <Download className="w-3 h-3" />
          <span>Report</span>
        </button>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 w-64"
              placeholder="Search departments..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            />
          </div>
          <button onClick={() => setSearch(searchInput)} className="btn-primary">Search</button>
          {search && <button onClick={() => { setSearch(''); setSearchInput('') }} className="btn-secondary">Clear</button>}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
          <Building2 className="w-4 h-4 text-emerald-500" />
          <span>Total: {filteredData.length} Departments</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
      />
    </div>
  )
}
