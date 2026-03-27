import { useCallback, useEffect, useState } from "react";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { getCurrentTeacher } from "@/services/courseService";
import type { Teacher } from "@/types/teacher";

interface UseTeacherState {
  teacher: Teacher | null;
  isTeacher: boolean;
  loading: boolean;
  error: string | null;
}

interface UseTeacherResult extends UseTeacherState {
  reload?: () => Promise<void>;
}

/**
 * Tracks whether the current authenticated user is registered as a teacher.
 */
export function useTeacher(): UseTeacherResult {
  const [state, setState] = useState<UseTeacherState>({
    teacher: null,
    isTeacher: false,
    loading: true,
    error: null,
  });

  const loadTeacher = useCallback(async () => {
    const token = authStore.getToken();

    if (!token) {
      setState({
        teacher: null,
        isTeacher: false,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      teacher: null,
      isTeacher: false,
      loading: true,
      error: null,
    }));

    try {
      const teacher = await getCurrentTeacher();

      setState({
        teacher,
        isTeacher: true,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "You are not registered as an active teacher.";

      setState({
        teacher: null,
        isTeacher: false,
        loading: false,
        error: message,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadTeacher();

    const handleAuthChange = () => {
      if (!cancelled) {
        void loadTeacher();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [loadTeacher]);

  return {
    ...state,
    reload: loadTeacher,
  };
}
