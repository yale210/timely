import { useEffect, useState } from "react"
import ConfirmationModal from "@/components/modals/ConfirmationModal"
import CreateGradeModal from "@/components/modals/CreateGradeModal.tsx"
import useCategories from "@/hooks/tasks/useCategories"
import AppLayout from "@/layouts/AppLayout"
import { GradebookFilterCategories, GradebookHeader, GradebookLayout, GradebookTable, GradebookStatus } from "@/components"
import { type Grade } from "@/components/gradebook/GradebookTable"

type EditInitial = {
  id?: number
  name?: string
  score?: number | ""
  total?: number | ""
  date?: string
  categoryId?: number | null
} | null

/**
 * Gradebook page showing a table of grades, filters and summary cards.
 *
 * Fetches grades from the API and provides create / edit / delete actions.
 */
export default function Gradebook() {
  const [grades, setGrades] = useState<Grade[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editInitial, setEditInitial] = useState<EditInitial>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const { categories } = useCategories()

  async function fetchGrades() {
    const res = await fetch("/api/grades/", { credentials: "include" })
    if (res.ok) {
      const data = await res.json() as Grade[]
      setGrades(data)
    } else {
      setGrades([])
    }
    setLoading(false)
  }

  function refreshGrades() {
    setLoading(true)
    void fetchGrades()
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchGrades()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  function getCsrfToken(): string | null {
    const match = /(?:^|; )csrftoken=([^;]+)/.exec(document.cookie)
    return match ? decodeURIComponent(match[1]) : null
  }

  async function deleteGrade(id: number) {
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/grades/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
    })
    if (res.ok) refreshGrades()
  }

  function handleEditGrade(grade: Grade) {
    setEditInitial({
      id: grade.id,
      name: grade.name,
      score: grade.score,
      total: grade.total_possible,
      date: grade.date_achieved,
      categoryId: grade.category ?? null,
    })
    setModalOpen(true)
  }

  const filteredGrades = grades
    ? selectedCategoryId == null
      ? grades
      : grades.filter((g) => g.category === selectedCategoryId)
    : []

  return (
    <AppLayout>
      <GradebookLayout>
        <GradebookHeader setModalOpen={setModalOpen}/>

        <GradebookFilterCategories
          loading={loading}
          grades={grades}
          filteredGrades={filteredGrades}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categories={categories}
        />

        <GradebookStatus
          loading={loading}
          gradesCount={grades?.length ?? 0}
          filteredCount={filteredGrades.length}
        />

        <GradebookTable
          loading={loading}
          filteredGrades={filteredGrades}
          onEdit={handleEditGrade}
          onDelete={setPendingDeleteId}
        />

        <CreateGradeModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditInitial(null)
          }}
          initialData={editInitial ?? undefined}
          onCreated={() => {
            setModalOpen(false)
            setEditInitial(null)
            refreshGrades()
          }}
          onUpdated={() => {
            setModalOpen(false)
            setEditInitial(null)
            refreshGrades()
          }}
        />
        <ConfirmationModal
          isOpen={pendingDeleteId !== null}
          title="Delete grade?"
          message="This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onClose={() => setPendingDeleteId(null)}
          onConfirm={() => {
            if (pendingDeleteId !== null) {
              void deleteGrade(pendingDeleteId);
            }
          }}
        />
      </GradebookLayout>
    </AppLayout>
  )
}
