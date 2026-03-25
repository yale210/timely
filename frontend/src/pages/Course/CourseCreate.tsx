import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout.tsx";
import * as courseService from "@/services/courseService.ts";
import { useTeacher } from "@/hooks/course/useTeacher.tsx";

/**
 * Component for creating a new course. It includes form fields for the course name
 * and description and handles course creation functionality by interacting with
 * a course service.
 * @returns The rendered CourseCreate component containing a form for
 * creating courses and user feedback/error handling.
 */
export default function CourseCreate() {
  const navigate = useNavigate();
  const { loading: teacherLoading, error: teacherError } = useTeacher();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    void navigate("/courses");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const course = await courseService.createCourse({
        name: name.trim(),
        description,
      });
      void navigate(`/courses/${course.id}`);
    } catch (createError) {
      console.error(createError);
      setError("Unable to create course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create Course</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new course and start managing it.
        </p>

        {teacherError && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {teacherError}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={void handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Course name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="e.g. Introduction to Python"
              required
              disabled={teacherLoading || saving}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="Write a short course description..."
              disabled={teacherLoading || saving}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={teacherLoading || saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create course"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}