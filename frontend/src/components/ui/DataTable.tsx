import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode }

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  total?: number
  page?: number
  pages?: number
  onPageChange?: (page: number) => void
  loading?: boolean
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, total, page = 1, pages = 1, onPageChange, loading
}: DataTableProps<T>) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {columns.map(col => (
                <th key={String(col.key)} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">No records found</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {columns.map(col => (
                    <td key={String(col.key)} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : String(row[col.key as string] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500">Total: {total} records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400">Page {page} of {pages}</span>
            <button onClick={() => onPageChange?.(page + 1)} disabled={page >= pages} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
