import { useState } from "react"
import useCategories from "@/hooks/tasks/useCategories"

interface Category { id: number; text: string }

/**
 * Props for CreateGradeModal component.
 * @property open Controls whether the modal is visible.
 * @property onClose Callback invoked to close the modal.
 * @property onCreated Optional callback invoked after a successful create.
 * @property onUpdated Optional callback invoked after a successful update.
 * @property initialData Optional initial values for editing an existing grade.
 */
interface Props {
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

/**
 * CreateGradeModal renders a small modal to create or edit a grade.
 * @param props Component props.
 * @param props.open Whether the modal is open.
 * @param props.onClose Function to call to close the modal.
 * @param props.onCreated Optional callback after creation.
 * @param props.onUpdated Optional callback after update.
 * @param props.initialData Optional initial values used when editing.
 */
export default function CreateGradeModal(props: Props) {
  const { open, onClose, onCreated, onUpdated, initialData } = props
  const [name, setName] = useState(initialData?.name ?? "")
  const [score, setScore] = useState<number | "">(initialData?.score ?? "")
  const [total, setTotal] = useState<number | "">(initialData?.total ?? "")
  const [date, setDate] = useState(initialData?.date ?? "")
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(initialData?.categoryId ?? null)
  const { categories } = useCategories()

  if (!open) return null

  //Helper function either returns the matching cookie from the document, or null.
  function getCookie(name: string): string | null {
    const regex = new RegExp(`(^| )${name}=([^;]+)`);
    const match=regex.exec(document.cookie);
    return match ? decodeURIComponent(match[2]) : null;
  }

  async function createGrade(payload: Record<string, unknown>) {
    const csrf = getCookie("csrftoken");
    return fetch("/api/grades/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {})
      },
      body: JSON.stringify(payload),
    });
  }

  /** Create a grade record via the API. */

  async function updateGrade(id: number, payload: Record<string, unknown>) {
    const csrf = getCookie("csrftoken");
    return fetch(`/api/grades/${id}/`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {})
      },
      body: JSON.stringify(payload),
    });
  }

  /** Update an existing grade via the API. */

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

    if (typeof initialData?.id === "number") {
      const res = await updateGrade(initialData.id, payload)
      if (res.ok) {
        void onUpdated?.()
      } else setError("Failed to update grade")
    } else {
      const res = await createGrade(payload)
      if (res.ok) {
        void onCreated?.()
      } else setError("Failed to create grade")
    }
  }
  
  /** Submit handler for the form; performs create or update. */

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow p-4 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">{initialData ? "Edit grade" : "Create grade"}</h2>
        <form onSubmit={(e) => void submit(e)} className="space-y-2">
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
              {categories?.map((c: Category) => (
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
