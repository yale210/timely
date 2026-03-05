interface GradebookStatusProps {
  loading: boolean
  gradesCount: number
  filteredCount: number
}

export default function GradebookStatus({
  loading,
  gradesCount,
  filteredCount,
}: GradebookStatusProps) {
  if (loading) return <div>Loading...</div>
  if (gradesCount === 0) return <div className="text-center text-gray-600">No grades yet. Add one above.</div>
  if (filteredCount === 0) return <div className="text-center text-gray-600">No grades found for this category.</div>
  return null
}
