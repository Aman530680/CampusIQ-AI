import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, GraduationCap } from 'lucide-react'
import { facultyService } from '../../services'
import DataTable from '../../components/ui/DataTable'
import type { Faculty } from '../../types'

export default function FacultyPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ['faculty'],
    queryFn: () => facultyService.list(),
  })

  // Filter faculty members locally by name, specialization, or designation
  const filteredData = data.filter(member => {
    const q = search.toLowerCase()
    return (
      member.name.toLowerCase().includes(q) ||
      (member.specialization && member.specialization.toLowerCase().includes(q)) ||
      (member.designation && member.designation.toLowerCase().includes(q)) ||
      member.faculty_id.toLowerCase().includes(q)
    )
  })

  const columns = [
    { key: 'faculty_id', label: 'Faculty ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'department', 
      label: 'Department',
      render: (row: Faculty) => row.department?.name || row.department?.code || '-'
    },
    { key: 'designation', label: 'Designation' },
    { key: 'specialization', label: 'Specialization' },
    { 
      key: 'experience_years', 
      label: 'Experience',
      render: (row: Faculty) => `${row.experience_years} Years`
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
              placeholder="Search faculty members..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            />
          </div>
          <button onClick={() => setSearch(searchInput)} className="btn-primary">Search</button>
          {search && <button onClick={() => { setSearch(''); setSearchInput('') }} className="btn-secondary">Clear</button>}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
          <GraduationCap className="w-4 h-4 text-indigo-500" />
          <span>Total: {filteredData.length} Members</span>
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
