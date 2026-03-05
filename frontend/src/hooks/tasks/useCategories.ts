import { useEffect, useState } from "react"
import { getCategories } from "@/services/taskService"

/**
 * Category represents a simple category record returned by the API.
 */
export interface Category { id: number; text: string }

/**
 * Hook to load categories from the API.
 *
 * Returns an object with `categories` and `loading` flag.
 */
export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await getCategories()
        if (mounted) setCategories(data)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  return { categories, loading }
}
