import { useEffect, useState } from "react";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { getCurrentTeacher } from "@/services/courseService";
import type { Teacher } from "@/types/teacher";

interface UseTeacherState {
  teacher: Teacher | null;
  isTeacher: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Tracks whether the current authenticated user is registered as a teacher.
 */
export function useTeacher() {
  const [state, setState] = useState<UseTeacherState>({
    teacher: null,
    isTeacher: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadTeacher = async () => {
      const token = authStore.getToken();

      if (!token) {
        if (cancelled) return;

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

        if (cancelled || controller.signal.aborted) return;

        setState({
          teacher,
          isTeacher: true,
          loading: false,
          error: null,
        });
      } catch (error: unknown) {
        if (cancelled || controller.signal.aborted) return;

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
    };

    void loadTeacher();

    const handleAuthChange = () => {
      void loadTeacher();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    return () => {
      cancelled = true;
      controller.abort();
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  return state;
}

