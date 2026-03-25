/**
 * Displays a compact gradebook preview for the About page.
 * @returns The rendered gradebook mockup.
 */
function GradebookMockup() {
  const entries = [
    { module: "Algorithms & Data Structures", grade: 78 },
    { module: "Database Systems", grade: 85 },
    { module: "Computer Networks", grade: 62 },
    { module: "Machine Learning", grade: 91 },
  ]
  const avg = Math.round(entries.reduce((sum, e) => sum + e.grade, 0) / entries.length)
  return (
    <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-900/8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Gradebook</p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          Avg {avg}%
        </span>
      </div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.module} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-700">{entry.module}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${entry.grade}%`,
                    backgroundColor:
                      entry.grade >= 80 ? "#10b981" : entry.grade >= 60 ? "#3b82f6" : "#ef4444",
                  }}
                />
              </div>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor:
                  entry.grade >= 80 ? "#d1fae5" : entry.grade >= 60 ? "#dbeafe" : "#fee2e2",
                color:
                  entry.grade >= 80 ? "#065f46" : entry.grade >= 60 ? "#1d4ed8" : "#991b1b",
              }}
            >
              {entry.grade}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GradebookMockup
