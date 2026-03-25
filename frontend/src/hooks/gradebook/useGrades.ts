import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { Grade } from "@/components/gradebook/GradebookTable"
import type { EditInitial } from "@/types"

type GradePerformanceFilter = "all" | "excellent" | "good" | "needs_attention"
type GradeSortOption = "date_desc" | "date_asc" | "percentage_desc" | "percentage_asc" | "name_asc"

interface UseGradesReturn {
  grades: Grade[] | null
  loading: boolean
  modalOpen: boolean
  editInitial: EditInitial
  search: string
  sortBy: GradeSortOption
  performanceFilter: GradePerformanceFilter
  selectedCategoryId: number | null
  pendingDeleteId: number | null
  filteredGrades: Grade[]
  setModalOpen: Dispatch<SetStateAction<boolean>>
  setSearch: Dispatch<SetStateAction<string>>
  setSortBy: Dispatch<SetStateAction<GradeSortOption>>
  setPerformanceFilter: Dispatch<SetStateAction<GradePerformanceFilter>>
  setSelectedCategoryId: Dispatch<SetStateAction<number | null>>
  setPendingDeleteId: Dispatch<SetStateAction<number | null>>
  refreshGrades: () => Promise<void>
  handleEditGrade: (grade: Grade) => void
  closeModal: () => void
  confirmDelete: () => Promise<void>
}

/**
 * Manage gradebook data and gradebook page UI state.
 */
export default function useGrades(): UseGradesReturn {
  const [grades, setGrades] = useState<Grade[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editInitial, setEditInitial] = useState<EditInitial>(null)
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<GradeSortOption>("date_desc")
  const [performanceFilter, setPerformanceFilter] = useState<GradePerformanceFilter>("all")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const fetchGrades = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/grades/", { credentials: "include" })
      if (res.ok) {
        const data = (await res.json()) as Grade[]
        setGrades(data)
      } else {
        setGrades([])
      }
    } catch {
      setGrades([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshGrades = useCallback(async (): Promise<void> => {
    setLoading(true)
    await fetchGrades()
  }, [fetchGrades])

  useEffect(() => {
    void refreshGrades()
  }, [refreshGrades])

  const getCsrfToken = useCallback((): string | null => {
    const match = /(?:^|; )csrftoken=([^;]+)/.exec(document.cookie)
    return match ? decodeURIComponent(match[1]) : null
  }, [])

  const deleteGradeById = useCallback(
    async (id: number): Promise<void> => {
      const csrfToken = getCsrfToken()
      const res = await fetch(`/api/grades/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      })

      if (res.ok) {
        await refreshGrades()
      }
    },
    [getCsrfToken, refreshGrades],
  )

  const handleEditGrade = useCallback((grade: Grade): void => {
    setEditInitial({
      id: grade.id,
      name: grade.name,
      score: grade.score,
      total: grade.total_possible,
      date: grade.date_achieved,
      categoryId: grade.category ?? null,
    })
    setModalOpen(true)
  }, [])

  const closeModal = useCallback((): void => {
    setModalOpen(false)
    setEditInitial(null)
  }, [])

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (pendingDeleteId === null) return
    await deleteGradeById(pendingDeleteId)
    setPendingDeleteId(null)
  }, [deleteGradeById, pendingDeleteId])

  const filteredGrades = useMemo<Grade[]>(() => {
    if (!grades) return []
    const normalizedSearch = search.trim().toLowerCase()

    const next = grades
      .filter((grade) => (
        selectedCategoryId == null ? true : grade.category === selectedCategoryId
      ))
      .filter((grade) => {
        if (performanceFilter === "all") return true
        if (performanceFilter === "excellent") return grade.percentage >= 85
        if (performanceFilter === "good") return grade.percentage >= 55 && grade.percentage < 85
        return grade.percentage < 55
      })
      .filter((grade) => {
        if (!normalizedSearch) return true
        return (
          grade.name.toLowerCase().includes(normalizedSearch)
          || (grade.category_name?.toLowerCase().includes(normalizedSearch) ?? false)
        )
      })

    next.sort((left, right) => {
      if (sortBy === "date_asc") {
        return left.date_achieved.localeCompare(right.date_achieved)
      }
      if (sortBy === "percentage_desc") {
        return right.percentage - left.percentage
      }
      if (sortBy === "percentage_asc") {
        return left.percentage - right.percentage
      }
      if (sortBy === "name_asc") {
        return left.name.localeCompare(right.name)
      }
      return right.date_achieved.localeCompare(left.date_achieved)
    })

    return next
  }, [grades, performanceFilter, search, selectedCategoryId, sortBy])

  return {
    grades,
    loading,
    modalOpen,
    editInitial,
    search,
    sortBy,
    performanceFilter,
    selectedCategoryId,
    pendingDeleteId,
    filteredGrades,
    setModalOpen,
    setSearch,
    setSortBy,
    setPerformanceFilter,
    setSelectedCategoryId,
    setPendingDeleteId,
    refreshGrades,
    handleEditGrade,
    closeModal,
    confirmDelete,
  }
}
