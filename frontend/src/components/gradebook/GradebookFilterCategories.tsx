import type { Dispatch, SetStateAction } from "react"
import type { Grade } from "@/components/gradebook/GradebookTable"

interface CategoryOption {
  id: number
  text: string
}

interface GradeBookFilterCategoriesProps {
  loading: boolean
  grades: Grade[] | null
  filteredGrades: Grade[]
  selectedCategoryId: number | null
  setSelectedCategoryId: Dispatch<SetStateAction<number | null>>
  categories?: CategoryOption[]
}

export default function GradebookFilterCategories({
  loading,
  grades,
  filteredGrades,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
}: GradeBookFilterCategoriesProps) {
  function averageToneClass(p: number): string {
    if (p < 50) return "bg-red-100 text-red-900"
    if (p < 70) return "bg-orange-100 text-orange-900"
    return "bg-green-100 text-green-900"
  }

  const average = () => {
    if (filteredGrades.length === 0) return 0
    const s = filteredGrades.reduce((acc, g) => acc + (g.percentage || 0), 0)
    return Math.round((s / filteredGrades.length) * 10) / 10
  }

  const avgValue = average()

  if (loading || !grades || filteredGrades.length === 0) return null

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
      <div className={`rounded-lg p-4 shadow-sm text-center flex flex-col items-center ${averageToneClass(avgValue)}`}>
        <div className="text-sm">Average Percentage</div>
        <div className="mt-2 text-2xl font-semibold">{avgValue}%</div>
      </div>

      <div className="hidden md:block md:col-span-3" />

      <div className="rounded-lg bg-white p-4">
        <label className="block text-sm text-gray-600 mb-2">Filter by Category</label>
        <select
          value={selectedCategoryId ?? ""}
          onChange={(e) => setSelectedCategoryId(e.target.value === "" ? null : Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 p-2 text-sm cursor-pointer bg-white"
        >
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
