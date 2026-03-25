import { useEffect, useState } from "react";
import { authStore } from "@/services/authService";
import { getCurrentTeacher } from "@/services/courseService";
import type { Teacher } from "@/types/teacher";

interface UseTeacherState {
  teacher: Teacher | null;
  isTeacher: boolean;
  loading: boolean;
  error: string | null;
}

/**
 *
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

    const token = authStore.getToken();

    if (!token) {
      setState({
        teacher: null,
        isTeacher: false,
        loading: false,
        error: null,
      });
      return () => {
        cancelled = true;
      };
    }

    const loadTeacher = async () => {
      setState({
        teacher: null,
        isTeacher: false,
        loading: true,
        error: null,
      });

      try {
        const teacher = await getCurrentTeacher();

        if (cancelled) return;

        setState({
          teacher,
          isTeacher: true,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          teacher: null,
          isTeacher: false,
          loading: false,
          error: "You are not registered as an active teacher.",
        });
      }
    };

    void loadTeacher();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

