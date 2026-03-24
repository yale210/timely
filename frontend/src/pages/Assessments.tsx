import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import CreateGradeModal from "@/components/modals/CreateGradeModal";
import AssessmentSection from "@/components/assessments/AssessmentSection";
import AssessmentModal from "@/components/assessments/AssessmentModal";
import { useAssessments } from "@/hooks/assessments/useAssessments";
import type { Assessment } from "@/types";

type AssessmentSort =
  | "due_date"
  | "-due_date"
  | "-weighting_of_assessment"
  | "title";

const Assessments = () => {
  const { state, loading, error, actions } = useAssessments();
  const [sortBy, setSortBy] = useState<AssessmentSort>("due_date");
  const {
    categories,
    sections,
    isGradebookEnabled,
    search,
    selectedCategoryId,
    isSidebarOpen,
    selectedAssessment,
    pendingDeleteId,
    gradebookSource,
  } = state;

  const sidebarKey = selectedAssessment
    ? `${selectedAssessment.id}-${selectedAssessment.updated_at}`
    : "new-assessment";

  const sortAssessments = (items: Assessment[]): Assessment[] => {
    const next = [...items];
    next.sort((left, right) => {
      if (sortBy === "title") {
        return left.title.localeCompare(right.title);
      }
      if (sortBy === "-weighting_of_assessment") {
        return right.weighting_of_assessment - left.weighting_of_assessment;
      }
      const leftDue = new Date(left.due_date).getTime();
      const rightDue = new Date(right.due_date).getTime();
      if (sortBy === "-due_date") {
        return rightDue - leftDue;
      }
      return leftDue - rightDue;
    });
    return next;
  };

  const sortedSections = {
    upcoming: sortAssessments(sections.upcoming),
    completed: sortAssessments(sections.completed),
  };

  return (
    <AppLayout>
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-2xl font-semibold text-black">Assessments</h1>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-base text-gray-400">search</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => actions.setSearch(event.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-black placeholder-gray-500 focus:border-primary focus:outline-none"
                placeholder="Search assessments"
              />
            </div>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <span className="material-icons mr-1.5 text-base">filter_list</span>
                Filter
              </MenuButton>
              <MenuItems className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none">
                <div className="p-1">
                  <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">Category</div>
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={() => actions.setSelectedCategoryId(null)}
                        className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${selectedCategoryId === null ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                      >
                        All categories
                      </button>
                    )}
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id}>
                      {({ focus }) => (
                        <button
                          onClick={() => actions.setSelectedCategoryId(category.id)}
                          className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${selectedCategoryId === category.id ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {category.text}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>

            <Menu as="div" className="relative">
              <MenuButton className="flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <span className="material-icons mr-1.5 text-base">sort</span>
                Sort
              </MenuButton>
              <MenuItems className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none">
                <div className="p-1">
                  {[
                    { value: "due_date", label: "Due date" },
                    { value: "-due_date", label: "Due date desc" },
                    { value: "-weighting_of_assessment", label: "Highest weighting" },
                    { value: "title", label: "Title" },
                  ].map((option) => (
                    <MenuItem key={option.value}>
                      {({ focus }) => (
                        <button
                          onClick={() => setSortBy(option.value as AssessmentSort)}
                          className={`${focus ? "bg-blue-50 text-primary" : "text-gray-700"} ${sortBy === option.value ? "bg-blue-50 font-bold text-primary" : ""} flex w-full items-center rounded-md px-3 py-2 text-sm`}
                        >
                          {option.label}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </div>
              </MenuItems>
            </Menu>
            <button
              type="button"
              onClick={actions.openNewAssessment}
              className="flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-300"
            >
              <span className="material-icons mr-1 text-base">add</span>
              New
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && state.assessments.length === 0 ? (
          <p className="mb-4 text-sm text-gray-500">Loading assessments...</p>
        ) : null}

        <AssessmentSection
          title="Upcoming"
          assessments={sortedSections.upcoming}
          onClick={actions.openAssessment}
          onAddToGradebook={actions.openGradebook}
          isGradebookEnabled={isGradebookEnabled}
        />

        <AssessmentSection
          title="Completed"
          assessments={sortedSections.completed}
          onClick={actions.openAssessment}
          onAddToGradebook={actions.openGradebook}
          isGradebookEnabled={isGradebookEnabled}
          isCollapsible={true}
          defaultCollapsed={true}
        />
      </div>

      <div key={sidebarKey}>
        <AssessmentModal
          isOpen={isSidebarOpen}
          onClose={actions.closeSidebar}
          assessment={selectedAssessment}
          categories={categories}
          onCreateCategory={actions.createCategory}
          onUpdateCategory={actions.updateCategory}
          onDeleteCategory={actions.deleteCategory}
          onSubmit={actions.submitAssessment}
          onDelete={() => {
            if (selectedAssessment?.id) {
              actions.setPendingDeleteId(selectedAssessment.id);
            }
          }}
        />
      </div>

      <ConfirmationModal
        isOpen={pendingDeleteId !== null}
        title="Delete assessment?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => actions.setPendingDeleteId(null)}
        onConfirm={() => {
          void actions.deleteAssessment();
        }}
      />

      <CreateGradeModal
        open={isGradebookEnabled && gradebookSource !== null}
        onClose={actions.closeGradebook}
        onCreated={actions.closeGradebook}
        onUpdated={actions.closeGradebook}
        initialData={
          gradebookSource
            ? {
                name: gradebookSource.title,
                date: gradebookSource.due_date.slice(0, 10),
                categoryId: gradebookSource.module_category?.id ?? gradebookSource.assessment_category?.id ?? gradebookSource.categories[0]?.id ?? null,
              }
            : undefined
        }
      />
    </AppLayout>
  );
};

export default Assessments;
