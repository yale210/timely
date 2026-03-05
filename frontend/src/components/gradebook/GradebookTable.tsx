/**
 * Grade record displayed in the gradebook table.
 */
export interface Grade {
  id: number
  name: string
  category?: number | null
  category_name?: string | null
  score: number
  total_possible: number
  percentage: number
  date_achieved: string
  time_spent_minutes: number
}

interface GradebookTableProps {
  loading: boolean
  filteredGrades: Grade[]
  onEdit: (grade: Grade) => void
  onDelete: (gradeId: number) => void
}

function formatDuration(minutes: number): string {
  if (!minutes) return "0m"
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function percentageClass(p: number | null | undefined): string {
  if (p == null) return "text-gray-600"
  if (p < 50) {
    return "inline-block rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700"
  }
  if (p < 70) {
    return "inline-block rounded bg-orange-100 px-2 py-0.5 text-sm font-semibold text-orange-700"
  }
  return "inline-block rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700"
}

/**
 * Display a table view of grade rows and expose edit/delete actions.
 * @param props - Table data and row action callbacks.
 * @returns A grade table when data exists, otherwise null.
 */
export default function GradebookTable(props: GradebookTableProps) {
  const { loading, filteredGrades, onEdit, onDelete } = props

  if (loading || filteredGrades.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Score</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Percentage</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Time spent</th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredGrades.map((grade) => (
            <tr key={grade.id}>
              <td className="whitespace-nowrap px-6 py-4">{grade.name}</td>
              <td className="whitespace-nowrap px-6 py-4">{grade.category_name ?? "-"}</td>
              <td className="whitespace-nowrap px-6 py-4">{grade.date_achieved}</td>
              <td className="whitespace-nowrap px-6 py-4">
                {grade.score}/{grade.total_possible}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className={percentageClass(grade.percentage)}>
                  {Math.round((grade.percentage ?? 0) * 10) / 10}%
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">{formatDuration(grade.time_spent_minutes)}</td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => onEdit(grade)}
                    className="rounded p-1 hover:bg-gray-100"
                    aria-label="Edit grade"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(grade.id)}
                    className="rounded p-1 hover:bg-gray-100"
                    aria-label="Delete this grade"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
