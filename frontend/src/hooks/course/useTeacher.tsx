import { useCallback, useEffect, useState } from "react";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { getCurrentTeacher } from "@/services/courseService";
import type { Teacher } from "@/types/teacher";

interface UseTeacherState {
  teacher: Teacher | null;
  loading: boolean;
  error: string | null;
}

interface UseTeacherResult extends UseTeacherState {
  isTeacher : boolean;
  reload?: () => Promise<void>;
}

const noTokenState = () => ({teacher: null, loading: false, error: null})
const successState = (teacher : Teacher) => ({teacher, loading : false, error: null})
const errorState = (e: unknown) => ({teacher: null, loading: false, error : e instanceof Error && e.message? e.message : "you are not registered as a teacher"})

/**
 * Tracks whether the current authenticated user is registered as a teacher.
 */
export function useTeacher(): UseTeacherResult {
  const [state, setState] = useState<UseTeacherState>({
    teacher: null,
    loading: true,
    error: null,
  });

  const loadTeacher = useCallback(async () => {
    const token = authStore.getToken();

    if(!token) {setState(noTokenState()); return};
    setState({teacher: null, loading: true, error: null})

    try {
      const teacher = await getCurrentTeacher();
      setState(successState(teacher))
    } catch (error: unknown) {
      setState(errorState(error));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadTeacher());
    const handler = () => void loadTeacher();
    window.addEventListener(AUTH_CHANGE_EVENT, handler);

    return () => { window.removeEventListener(AUTH_CHANGE_EVENT, handler); };
  }, [loadTeacher]);

  return {  ...state, isTeacher: state.teacher !== null, reload: loadTeacher,};
}
