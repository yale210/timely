import { useEffect, useMemo, useState } from "react";
import { getCoursePermissions,  } from "@/services/courseService";
import type {CoursePermissions} from "@/types/course.ts";

interface UseCoursePermissionsResult {
  permissions: CoursePermissions;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 *
 * @param courseId
 */
export function useCoursePermissions(courseId?: number | null): UseCoursePermissionsResult {
  const [permissions, setPermissions] = useState<CoursePermissions | null>(null);
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
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasCourseId) {
      setPermissions(null);
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