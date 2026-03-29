import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useCourses } from "@/hooks/course/useCourse";
import { useCourseManagementState } from "@/hooks/course/useCourseManagementState";
import { useCourseManagementHooks, openEditModal } from "@/hooks/course/useCourseManagementHooks";
import CourseManagementHeader from "@/components/course/CourseManagementHeader";
import CourseManagementTable from "@/components/course/CourseManagementTable";

/**
 * Course management page for teachers and staff.
 * Allows creating, editing, and managing students in courses.
 */
export default function CourseManagement() {
  const { state, managedFilteredCourses, loading, error, actions } = useCourses();
  const courseManagementState = useCourseManagementState();
  const courseManagementHooks = useCourseManagementHooks(courseManagementState, actions, managedFilteredCourses);

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        <CourseManagementHeader
          state={state}
          actions={actions}
          refreshCourses={courseManagementHooks.refreshCourses}
          openCreateModal={courseManagementHooks.openCreateModal}
        />

        <main className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{courseManagementHooks.courseCountText}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && managedFilteredCourses.length === 0 && (
            <p className="text-sm text-gray-500">Loading courses...</p>
          )}

          {!loading && managedFilteredCourses.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <span className="material-icons text-4xl text-gray-400">school</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">No courses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first course to get started.
              </p>
              <button
                type="button"
                onClick={courseManagementHooks.openCreateModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create Course
              </button>
            </div>
          )}

          {managedFilteredCourses.length > 0 && (
            <CourseManagementTable
              courses={managedFilteredCourses}
              courseManagementState={courseManagementState}
              onOpenEditModal={(course) => openEditModal(courseManagementState, course)}
            />
            )}
        </main>

        {courseManagementState.showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close create modal backdrop"
              onClick={() => courseManagementState.setShowCreateModal(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Create New Course</h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the details for your new course.
              </p>

              {courseManagementState.formError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {courseManagementState.formError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="create-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Course Name *
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    value={courseManagementState.createForm.name}
                    onChange={(e) =>
                      courseManagementState.setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Introduction to..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="create-description"
                    rows={3}
                    value={courseManagementState.createForm.description}
                    onChange={(e) =>
                      courseManagementState.setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="A brief overview of the course..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => courseManagementState.setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void courseManagementHooks.handleCreate()}
                  disabled={courseManagementState.isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {courseManagementState.isSubmitting ? "Creating..." : "Create Course"}
                </button>
              </div>
            </div>
          </div>
        )}

        {courseManagementState.editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close edit modal backdrop"
              onClick={() => courseManagementState.setEditingCourse(null)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Edit Course</h2>
              <p className="mt-1 text-sm text-gray-500">Update the course details.</p>

              {courseManagementState.formError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {courseManagementState.formError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="edit-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Course Name *
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={courseManagementState.editForm.name ?? ""}
                    onChange={(e) =>
                      courseManagementState.setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={courseManagementState.editForm.description ?? ""}
                    onChange={(e) =>
                      courseManagementState.setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => courseManagementState.setEditingCourse(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void courseManagementHooks.handleUpdate()}
                  disabled={courseManagementState.isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {courseManagementState.isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={courseManagementState.deleteTarget !== null}
          onClose={() => courseManagementState.setDeleteTarget(null)}
          onConfirm={() => void courseManagementHooks.handleDelete()}
          title="Delete Course?"
          message={`Are you sure you want to inactivate "${courseManagementState.deleteTarget?.name}"? Students will miss out`}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {courseManagementState.studentsTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close students modal backdrop"
              onClick={() => courseManagementState.setStudentsTarget(null)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Students in {courseManagementState.studentsTarget.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    All students enrolled in this course.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => courseManagementState.setStudentsTarget(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-6">
                {courseManagementState.studentsLoading ? (
                  <p className="text-sm text-gray-500">Loading students...</p>
                ) : courseManagementState.students.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No students are enrolled in this course.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                    {courseManagementState.students.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="font-medium text-gray-900">{student.username}</div>
                        <button
                          type="button"
                          onClick={() => void courseManagementHooks.handleRemoveStudent(student.id)}
                          disabled={courseManagementState.removingStudentId === student.id}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {courseManagementState.removingStudentId === student.id ? "Removing..." : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
