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

const filterByCategory = (grade: Grade, categoryId: number | null) =>
  categoryId === null ? true : grade.category === categoryId

const filterByPerformance = (grade: Grade, filter: GradePerformanceFilter) => {
  if (filter === "all") return true
  if (filter === "excellent") return grade.percentage >= 85
  if (filter === "good") return grade.percentage >= 55 && grade.percentage < 85
  return grade.percentage < 55
}

const filterBySearch = (grade: Grade, search: string) => {
  if (!search) return true
  const normalisedSearch = search.trim().toLowerCase()
  return (
    grade.name.toLowerCase().includes(normalisedSearch)
    || (grade.category_name?.toLowerCase().includes(normalisedSearch) ?? false)
  )
}

const sortGrades = (left: Grade, right: Grade, sortBy: GradeSortOption) => {
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
}

const useGradesState = () => {
  const [grades, setGrades] = useState<Grade[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editInitial, setEditInitial] = useState<EditInitial>(null)
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<GradeSortOption>("date_desc")
  const [performanceFilter, setPerformanceFilter] = useState<GradePerformanceFilter>("all")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  return {
    grades,
    setGrades,
    loading,
    setLoading,
    modalOpen,
    setModalOpen,
    editInitial,
    setEditInitial,
    search,
    setSearch,
    sortBy,
    setSortBy,
    performanceFilter,
    setPerformanceFilter,
    selectedCategoryId,
    setSelectedCategoryId,
    pendingDeleteId,
    setPendingDeleteId,
  }
}

type GradesState = ReturnType<typeof useGradesState>

const useGradesActions = (state: GradesState) => {
  const { setGrades, setLoading, setModalOpen, setEditInitial, setPendingDeleteId, pendingDeleteId } = state

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
  }, [setGrades, setLoading])

  const refreshGrades = useCallback(async (): Promise<void> => {
    setLoading(true)
    await fetchGrades()
  }, [fetchGrades, setLoading])

  useEffect(() => {
    void refreshGrades()
  }, [refreshGrades])

  const deleteGradeById = useCallback(
    async (id: number): Promise<void> => {
      const match = /(?:^|; )csrftoken=([^;]+)/.exec(document.cookie)
      const csrfToken = match ? decodeURIComponent(match[1]) : null
      const res = await fetch(`/api/grades/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
      })

      if (res.ok) {
        await refreshGrades()
      }
    },
    [refreshGrades],
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
  }, [setEditInitial, setModalOpen])

  const closeModal = useCallback((): void => {
    setModalOpen(false)
    setEditInitial(null)
  }, [setModalOpen, setEditInitial])

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (pendingDeleteId === null) return
    await deleteGradeById(pendingDeleteId)
    setPendingDeleteId(null)
  }, [deleteGradeById, pendingDeleteId, setPendingDeleteId])

  return { refreshGrades, handleEditGrade, closeModal, confirmDelete }
}

const useFilteredGrades = (state: GradesState) => {
  const { grades, performanceFilter, search, selectedCategoryId, sortBy } = state
  return useMemo<Grade[]>(() => {
    if (!grades) return []
    return grades
      .filter((grade) => filterByCategory(grade, selectedCategoryId))
      .filter((grade) => filterByPerformance(grade, performanceFilter))
      .filter((grade) => filterBySearch(grade, search))
      .sort((left, right) => sortGrades(left, right, sortBy))
  }, [grades, performanceFilter, search, selectedCategoryId, sortBy])
}

/**
 * Manage gradebook data and gradebook page UI state.
 */
export default function useGrades(): UseGradesReturn {
  const state = useGradesState()
  const actions = useGradesActions(state)
  const filteredGrades = useFilteredGrades(state)

  return {
    ...state,
    ...actions,
    filteredGrades,
  }
}
