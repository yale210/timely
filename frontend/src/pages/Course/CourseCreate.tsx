import { useEffect, useState } from "react";
import {Navigate, useNavigate} from "react-router-dom";
import AppLayout from "@/layouts/AppLayout.tsx";
import * as courseService from "@/services/courseService.ts";
import { useTeacher } from "@/hooks/course/useTeacher.tsx";
import {authStore} from "@/services/authService.ts";

/**
 *
 */
export default function CourseCreate() {
  const navigate = useNavigate();
  const { teacher, loading: teacherLoading, error: teacherError } = useTeacher();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);


  const canAccess = true;
  useEffect(() => {
    if (!teacherLoading && !canAccess) {
         navigate("/courses", { replace: true });
    }
  }, [canAccess, teacherLoading, navigate]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const course = await courseService.createCourse({ name, description });
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

        <form onSubmit={ handleCreate} className="mt-6 space-y-4">
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
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create course"}
            </button>

            <button
              type="button"
              onClick={() =>  navigate("/courses")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </AppLayout>
  );
}