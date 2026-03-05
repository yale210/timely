import ConfirmationModal from "@/components/modals/ConfirmationModal"
import CreateGradeModal from "@/components/modals/CreateGradeModal.tsx"
import useCategories from "@/hooks/tasks/useCategories"
import useGrades from "@/hooks/gradebook/useGrades"
import AppLayout from "@/layouts/AppLayout"
import {
  GradebookFilterCategories,
  GradebookHeader,
  GradebookLayout,
  GradebookStatus,
  GradebookTable,
} from "@/components"

/**
 * Gradebook page showing a table of grades, filters and summary cards.
 */
export default function Gradebook() {
  const {
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
  } = useGrades()
  const { categories } = useCategories()

  return (
    <AppLayout>
      <GradebookLayout>
        <GradebookHeader setModalOpen={setModalOpen} />

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
          onClose={closeModal}
          initialData={editInitial ?? undefined}
          onCreated={() => {
            closeModal()
            void refreshGrades()
          }}
          onUpdated={() => {
            closeModal()
            void refreshGrades()
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
            void confirmDelete()
          }}
        />
      </GradebookLayout>
    </AppLayout>
  )
}
