import { useEffect, useMemo, useState } from "react";
import { getCoursePermissions,  } from "@/services/courseService";

import {CoursePeED} from "@/types/coursePermissions.ts";
import type { CoursePermissions } from "@/types/course";

interface UseCoursePermissionsResult {
  permissions: CoursePermissions;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Fetches and manages the permissions associated with a specific course. Provides state for permissions, loading status,
 * error messages, and a method to refresh the permissions data.
 * @param courseId - The ID of the course for which permissions are being fetched. If null or undefined, no permissions data is fetched.
 * @returns An object containing the course permissions, loading state, error message, and a method to refresh the data.
 */
export function useCoursePermissions(courseId?: number | null): UseCoursePermissionsResult {
    const defaultPermissions = new CoursePeED().options;

  const [permissions, setPermissions] = useState<CoursePermissions>(defaultPermissions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCourseId = useMemo(
    () => typeof courseId === "number" && Number.isFinite(courseId),
    [courseId],
  );

  const refresh = async () => {
    if (!hasCourseId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getCoursePermissions(courseId);
      setPermissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course permissions.");
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasCourseId) {
      setPermissions(defaultPermissions);
      return;
    }

    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, hasCourseId]);

  return {
    permissions,
    loading,
    error,
    refresh,
  };
}