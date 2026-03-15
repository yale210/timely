import { useEffect, useState } from "react"
import { getCategories } from "@/services/taskService"
import type { Category } from "@/types"

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
      } catch (error) {
        console.error("Failed to load categories:", error)
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

