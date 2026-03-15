import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { Grade } from "@/components/gradebook/GradebookTable"
import type { EditInitial } from "@/types"

interface UseGradesReturn {
  grades: Grade[] | null
  loading: boolean
  modalOpen: boolean
  editInitial: EditInitial
  selectedCategoryId: number | null
  pendingDeleteId: number | null
  filteredGrades: Grade[]
  setModalOpen: Dispatch<SetStateAction<boolean>>
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
    return selectedCategoryId == null
      ? grades
      : grades.filter((grade) => grade.category === selectedCategoryId)
  }, [grades, selectedCategoryId])

  return {
    grades,
    loading,
    modalOpen,
    editInitial,
    selectedCategoryId,
    pendingDeleteId,
    filteredGrades,
    setModalOpen,
    setSelectedCategoryId,
    setPendingDeleteId,
    refreshGrades,
    handleEditGrade,
    closeModal,
    confirmDelete,
  }
}

