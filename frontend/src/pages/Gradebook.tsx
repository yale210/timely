import ConfirmationModal from "@/components/modals/ConfirmationModal"
import CreateGradeModal from "@/components/modals/CreateGradeModal.tsx"
import useCategories from "@/hooks/tasks/useCategories"
import useGrades from "@/hooks/gradebook/useGrades"
import AppLayout from "@/layouts/AppLayout"
import {
  GradebookFilterCategories,
  GradebookHeader,
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
  } = useGrades()
  const { categories } = useCategories()
  const filterCategories = categories.filter((category) => (
    (grades ?? []).some((grade) => grade.category === category.id)
  ))

  return (
    <AppLayout>
      <GradebookHeader
        setModalOpen={setModalOpen}
        search={search}
        sortBy={sortBy}
        performanceFilter={performanceFilter}
        selectedCategoryId={selectedCategoryId}
        categories={filterCategories}
        onSearchChange={setSearch}
        onSortChange={setSortBy}
        onPerformanceFilterChange={setPerformanceFilter}
        onCategoryChange={setSelectedCategoryId}
      />

      <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
        <GradebookFilterCategories
          loading={loading}
          grades={grades}
          filteredGrades={filteredGrades}
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
      </div>

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
    </AppLayout>
  )
}
