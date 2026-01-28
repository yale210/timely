import { useState, useEffect } from "react"
import useCategories from "../hooks/useCategories"

type Category = { id: number; text: string }

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  onUpdated?: () => void
  initialData?: {
    id?: number
    name?: string
    score?: number | ""
    total?: number | ""
    date?: string
    categoryId?: number | null
  }
}

export default function CreateGradeModal({ open, onClose, onCreated, onUpdated, initialData }: Props) {
  const [name, setName] = useState("")
  const [score, setScore] = useState<number | "">("")
  const [total, setTotal] = useState<number | "">("")
  const [date, setDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const { categories } = useCategories()

  useEffect(() => {
    if (!open) return
    if (!initialData) {
      setName("")
      setScore("")
      setTotal("")
      setDate("")
      setCategoryId(null)
      return
    }
    if (initialData.name) setName(initialData.name)
    if (typeof initialData.score !== "undefined") setScore(initialData.score)
    if (typeof initialData.total !== "undefined") setTotal(initialData.total)
    if (initialData.date) setDate(initialData.date)
    if (typeof initialData.categoryId !== "undefined") setCategoryId(initialData.categoryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData])

  if (!open) return null

  async function createGrade(payload: Record<string, unknown>) {
    return fetch("/api/grades/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  }

  async function updateGrade(id: number, payload: Record<string, unknown>) {
    return fetch(`/api/grades/${id}/`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (typeof score !== "number" || typeof total !== "number") {
      setError("Please provide numeric values for score and total.")
      return
    }
    if (score > total) {
      setError("Score must be less than or equal to total.")
      return
    }
    const payload = {
      name,
      category: categoryId,
      score,
      total_possible: total,
      date_achieved: date,
    }
    if (initialData && typeof initialData.id === "number") {
      const res = await updateGrade(initialData.id, payload)
      if (res.ok) {
        if (onUpdated) onUpdated()
      } else setError("Failed to update grade")
    } else {
      const res = await createGrade(payload)
      if (res.ok) {
        if (onCreated) onCreated()
      } else setError("Failed to create grade")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow p-4 w-full max-w-md">
  <h2 className="text-lg font-semibold mb-2">{initialData ? "Edit grade" : "Create grade"}</h2>
        <form onSubmit={submit} className="space-y-2">
          <input
            placeholder="Assessment name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Score"
              value={String(score)}
              onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Total"
              value={String(total)}
              onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full border p-2 rounded mb-2 cursor-pointer"
            >
              <option value="">None</option>
              {categories &&
                categories.map((c: Category) => (
                  <option key={c.id} value={c.id}>
                    {c.text}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <input
              id="grade-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition transform duration-150 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition transform duration-150 text-white px-4 py-2 rounded cursor-pointer"
            >
              {initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
