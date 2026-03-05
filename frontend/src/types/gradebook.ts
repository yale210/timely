/**
 * Type for editing gradebook entry initial data.
 */
export type EditInitial = {
  id?: number
  name?: string
  score?: number | ""
  total?: number | ""
  date?: string
  categoryId?: number | null
} | null