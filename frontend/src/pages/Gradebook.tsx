import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import CreateGradeModal from "../components/CreateGradeModal.tsx"
import useCategories from "../hooks/useCategories"

interface Grade {
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

type EditInitial = {
  id?: number
  name?: string
  score?: number | ""
  total?: number | ""
  date?: string
  categoryId?: number | null
} | null

/**
 * Format a duration given in minutes into a short human readable string.
 * Examples: 0 -> "0m", 90 -> "1h 30m".
 * @param minutes Minutes to format.
 * @returns A compact duration string.
 */
function format_duration(minutes: number): string {
  if (!minutes) return "0m"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

/**
 * Choose a CSS class for a percentage badge based on thresholds.
 * @param p Percentage value (may be null/undefined).
 * @returns A string of classes to style the percentage badge.
 */
function percentageClass(p: number | null | undefined): string {
  switch (true) {
    case p == null:
      return "text-gray-600"
    case (p!) < 50:
      return "inline-block text-sm font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded"
    case (p!) < 70:
      return "inline-block text-sm font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded"
    default:
      return "inline-block text-sm font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded"
  }
}

/**
 * Gradebook page showing a table of grades, filters and summary cards.
 *
 * Fetches grades from the API and provides create / edit / delete actions.
 */
export default function Gradebook() {
  const [grades, setGrades] = useState<Grade[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editInitial, setEditInitial] = useState<EditInitial>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const { categories } = useCategories()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");    
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      console.log("loaded saved theme")
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);


  useEffect(() => {
    void fetchGrades()
    
  }, [])

 useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  async function fetchGrades() {
    setLoading(true)
    const res = await fetch("/api/grades/", { credentials: "include" })
    if (res.ok) {
      const data = await res.json() as Grade[]
      setGrades(data)
    } else {
      setGrades([])
    }
    setLoading(false)
  }

  async function deleteGrade(id: number) {
    if (!confirm("Delete this grade?")) return
    const res = await fetch(`/api/grades/${id}/`, { method: "DELETE", credentials: "include" })
    if (res.ok) void fetchGrades()
  }

  const filteredGrades = grades
    ? selectedCategoryId == null
      ? grades
      : grades.filter((g) => g.category === selectedCategoryId)
    : []

  const average = () => {
    if (!filteredGrades || filteredGrades.length === 0) return 0
    const s = filteredGrades.reduce((acc, g) => acc + (g.percentage || 0), 0)
    return Math.round((s / filteredGrades.length) * 10) / 10
  }

  const avgValue = average()

  function moodEmoji(p: number): string {
    switch (true) {
      case p >= 70:
        return "😊"
      case p >= 50:
        return "😐"
      default:
        return "😞"
    }
  }

  return (
  <div className="p-6 font-young-coconut">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Back to home" title="Back to home" className="p-2 rounded hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Gradebook</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition transform duration-150 px-4 py-2 text-white cursor-pointer"
          >
            Add grade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-center">
  <div className="col-span-1 p-4 shadow rounded border border-black">
          <div className="text-sm text-gray-500">Average Percentage</div>
          <div className="text-xl font-semibold">
            {avgValue}%
            <span className="ml-3" role="img" aria-label={avgValue >= 70 ? "happy" : avgValue >= 50 ? "neutral" : "sad"}>
              {moodEmoji(avgValue)}
            </span>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2 p-4">
          <label className="block text-sm text-gray-600 mb-1">Filter by Category</label>
          <select
            value={selectedCategoryId ?? ""}
            onChange={(e) => setSelectedCategoryId(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full max-w-xs border p-2 rounded cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.text}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && (!grades || grades.length === 0) && (
        <div className="text-center text-gray-600">No grades yet. Add one above.</div>
      )}

      {!loading && grades && filteredGrades.length === 0 && grades.length > 0 && (
        <div className="text-center text-gray-600">No grades found for this category.</div>
      )}

      {!loading && grades && filteredGrades.length > 0 && (
        <div className="overflow-x-auto shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Time spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{g.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.category_name ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.date_achieved}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.score}/{g.total_possible}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={percentageClass(g.percentage)}>
                      {Math.round((g.percentage ?? 0) * 10) / 10}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{format_duration(g.time_spent_minutes)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setEditInitial({
                            id: g.id,
                            name: g.name,
                            score: g.score,
                            total: g.total_possible,
                            date: g.date_achieved,
                            categoryId: g.category ?? null,
                          })
                          setModalOpen(true)
                        }}
                        className="p-1 rounded hover:bg-gray-100"
                        aria-label="Edit grade"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button onClick={() => { void deleteGrade(g.id); }} className="p-1 rounded hover:bg-gray-100" aria-label="Delete grade" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
      )}

      <CreateGradeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditInitial(null)
        }}
        initialData={editInitial ?? undefined}
        onCreated={() => {
          setModalOpen(false)
          setEditInitial(null)
          void fetchGrades()
        }}
        onUpdated={() => {
          setModalOpen(false)
          setEditInitial(null)
          void fetchGrades()
        }}
      />
    </div>
  )
}
