import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useCourses } from "@/hooks/course/useCourse";
import { getCourseStudents } from "@/services/courseService";
import type { Course, CourseCreation, CourseStudent, CourseUpdate } from "@/types/course";

/**
 * Course management page for teachers and staff.
 * Allows creating, editing, and managing students in courses.
 */
export default function CourseManagement() {
  const { state, managedFilteredCourses, loading, error, actions } = useCourses();

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [studentsTarget, setStudentsTarget] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [createForm, setCreateForm] = useState<CourseCreation>({
    name: "",
    description: "",
  });
  const [editForm, setEditForm] = useState<CourseUpdate>({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => {
    setFormError(null);
    setCreateForm({ name: "", description: "" });
    setShowCreateModal(true);
  };

  const refreshCourses = () => {
    void actions.refresh();
  };

  useEffect(() => {
    if (!studentsTarget) {
      setStudents([]);
      return;
    }

    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const data = await getCourseStudents(studentsTarget.id);
        setStudents(data);
      } catch (loadError) {
        console.error(loadError);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    void loadStudents();
  }, [studentsTarget]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setFormError("Course name is required.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await actions.createCourse(createForm);
      if (result) {
        setShowCreateModal(false);
        setCreateForm({ name: "", description: "" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditForm({
      name: course.name,
      description: course.description,
    });
    setFormError(null);
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;

    if (!editForm.name?.trim()) {
      setFormError("Course name is required.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await actions.updateCourse(editingCourse.id, editForm);
      if (result) {
        setEditingCourse(null);
        setEditForm({ name: "", description: "" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    try {
      await actions.deleteCourse(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };



  const courseCountText = useMemo(() => {
    const count = managedFilteredCourses.length;
    return count === 1 ? "1 course" : `${count} courses`;
  }, [managedFilteredCourses.length]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Teacher Tools</p>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create, edit, and manage your courses and students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search courses..."
                value={state.search}
                onChange={(e) => actions.setSearch(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={refreshCourses}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                + New Course
              </button>

            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{courseCountText}</p>
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
                onClick={openCreateModal}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create Course
              </button>
            </div>
          )}

          {managedFilteredCourses.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {managedFilteredCourses.map((course) => (
                    <tr key={course.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="font-medium text-gray-900">{course.name}</div>
                        <div className="text-xs text-gray-500">ID: {course.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="max-w-xs truncate text-sm text-gray-600">
                          {course.description || "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            course.active !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {course.active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                        {new Date(course.created_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setStudentsTarget(course)}
                            className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 transition-colors hover:bg-indigo-50"
                          >
                            View students
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(course)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(course)}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close create modal backdrop"
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Create New Course</h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the details for your new course.
              </p>

              {formError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
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
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }))
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
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="A brief overview of the course..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Course"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close edit modal backdrop"
              onClick={() => setEditingCourse(null)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Edit Course</h2>
              <p className="mt-1 text-sm text-gray-500">Update the course details.</p>

              {formError && (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
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
                    value={editForm.name ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
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
                    value={editForm.description ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdate()}
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
          title="Delete Course?"
          message={`Are you sure you want to inactivate "${deleteTarget?.name}"? Students will miss out`}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {studentsTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              aria-label="Close students modal backdrop"
              onClick={() => setStudentsTarget(null)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Students in {studentsTarget.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    All students enrolled in this course.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentsTarget(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-6">
                {studentsLoading ? (
                  <p className="text-sm text-gray-500">Loading students...</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No students are enrolled in this course.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                    {students.map((student) => (
                      <li key={student.id} className="px-4 py-3">
                        <div className="font-medium text-gray-900">{student.username}</div>
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