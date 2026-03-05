interface GradebookStatusProps {
  loading: boolean
  gradesCount: number
  filteredCount: number
}

/**
 * Displays the status of the gradebook including loading state and grade counts.
 * @param props - The component props.
 * @returns The status message or null if grades exist.
 */
export default function GradebookStatus(props: GradebookStatusProps) {
  const { loading, gradesCount, filteredCount } = props

  if (loading) return <div>Loading...</div>
  if (gradesCount === 0) return <div className="text-center text-gray-600">No grades yet. Add one above.</div>
  if (filteredCount === 0) return <div className="text-center text-gray-600">No grades found for this category.</div>
  return null
}
