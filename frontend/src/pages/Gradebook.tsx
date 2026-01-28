import { useEffect, useState } from "react"
import CreateGradeModal from "../components/CreateGradeModal.tsx"

type Grade = {
  id: number
  name: string
  score: number
  total_possible: number
  percentage: number
  date_achieved: string
  time_spent_minutes: number
}

function format_duration(minutes: number): string {
  if (!minutes) return "0m"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export default function Gradebook() {
  const [grades, setGrades] = useState<Grade[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchGrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchGrades() {
    setLoading(true)
    const res = await fetch("/api/grades/", { credentials: "include" })
    if (res.ok) {
      const data = await res.json()
      setGrades(data)
    } else {
      setGrades([])
    }
    setLoading(false)
  }

  const average = () => {
    if (!grades || grades.length === 0) return 0
    const s = grades.reduce((acc, g) => acc + (g.percentage || 0), 0)
    return Math.round((s / grades.length) * 10) / 10
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gradebook</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-indigo-600 px-4 py-2 text-white"
          >
            Add grade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 p-4 shadow rounded">
          <div className="text-sm text-gray-500">Average Percentage</div>
          <div className="text-xl font-semibold">{average()}%</div>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && grades && grades.length === 0 && (
        <div className="text-center text-gray-600">No grades yet. Add one above.</div>
      )}

      {!loading && grades && grades.length > 0 && (
        <div className="overflow-x-auto shadow rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Time spent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grades.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{g.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.date_achieved}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.score}/{g.total_possible}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{g.percentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{format_duration(g.time_spent_minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateGradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false)
          fetchGrades()
        }}
      />
    </div>
  )
}
