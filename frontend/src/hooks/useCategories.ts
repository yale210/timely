import { useEffect, useState } from "react"

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
        const res = await fetch("/api/categories/", { credentials: "include" })
        if (res.ok) {
          const data = await res.json() as Category[]
          if (mounted) setCategories(data)
        }
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
