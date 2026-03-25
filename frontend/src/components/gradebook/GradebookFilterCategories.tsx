import type { Grade } from "@/components/gradebook/GradebookTable"

interface GradeBookFilterCategoriesProps {
  loading: boolean
  grades: Grade[] | null
  filteredGrades: Grade[]
}

const MESSAGE_BANDS = [
  {
    min: 95,
    messages: [
      "Outstanding work! You’re setting the standard.",
      "Top-tier performance.",
      "You've mastered this!",
    ],
  },
  {
    min: 85,
    messages: [
      "Excellent performance",
      "Strong work",
      "Great job",
    ],
  },
  {
    min: 75,
    messages: [
      "You're doing well",
      "Good progress",
    ],
  },
  {
    min: 65,
    messages: [
      "Solid work",
      "A good foundation",
    ],
  },
  {
    min: 55,
    messages: [
      "You’re passing - now aim higher.",
      "Good start - identify areas to strengthen.",
      "There’s room to improve - review feedback carefully",
      "Work on consistency across topics.",
    ],
  },
  {
    min: 45,
    messages: [
      "Focus on key concepts to improve quickly.",
      "Small improvements could make a big difference.",
      "Review mistakes carefully - they show where to improve.",
    ],
  },
  {
    min: 35,
    messages: [
      "Regular practice will improve confidence.",
      "Seek feedback early and often.",
      "Time to adjust your study strategy.",
    ],
  },
  {
    min: 0,
    messages: [
      "Start small and rebuild confidence.",
      "Every improvement counts.",
      "Create a simple study plan and stick to it.",
    ],
  },
] as const

/**
 * Displays the average percentage summary card and motivational message for the gradebook.
 * @param props - Gradebook summary inputs.
 * @returns The rendered average percentage summary card.
 */
export default function GradebookFilterCategories(props: GradeBookFilterCategoriesProps) {
  const {
    loading,
    grades,
    filteredGrades,
  } = props

  /**
   * Returns the colour treatment for the average summary card.
   * @param p - Current average percentage or null when unavailable.
   * @returns Tailwind classes for the card tone.
   */
  function averageToneClass(p: number | null): string {
    if (p === null) return "bg-gray-200 text-gray-900"
    if (p < 50) return "bg-red-200 text-red-950"
    if (p < 70) return "bg-orange-200 text-orange-950"
    return "bg-green-200 text-green-950"
  }

  const average = (): number | null => {
    if (filteredGrades.length === 0) return null
    const s = filteredGrades.reduce((acc, g) => acc + (g.percentage || 0), 0)
    return Math.round((s / filteredGrades.length) * 10) / 10
  }

  const avgValue = average()
  const avgLabel = avgValue === null ? "-%" : `${avgValue}%`
  const avgMessage = avgValue === null
    ? "No grades yet."
    : (() => {
        const band = MESSAGE_BANDS.find((entry) => avgValue >= entry.min) ?? MESSAGE_BANDS[MESSAGE_BANDS.length - 1]
        const messageIndex = Math.abs(Math.round(avgValue * 10)) % band.messages.length
        return band.messages[messageIndex]
      })()

  if (loading || !grades) return null

  return (
    <div className="mb-6">
      <div className={`rounded-lg p-4 shadow-sm text-center flex flex-col items-center ${averageToneClass(avgValue)}`}>
        <div className="text-sm">Average Percentage</div>
        <div className="mt-2 text-2xl font-semibold">{avgLabel}</div>
        <div className="mt-2 text-sm">{avgMessage}</div>
      </div>
    </div>
  )
}
