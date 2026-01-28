import { useEffect, useState } from "react"

export type Category = { id: number; text: string }

export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/categories/", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (mounted) setCategories(data)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { categories, loading }
}
