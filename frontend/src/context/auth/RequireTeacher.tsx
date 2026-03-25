import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useTeacher } from "@/hooks/course/useTeacher";
import {authStore} from "@/services/authService.ts";

/**
 * Route guard that restricts access to teachers.
 * Unauthenticated visitors are sent to /login.
 * Non-teachers are redirected to /courses.
 * @param props
 * @param props.children
 */
export default function RequireTeacher(props: { children: ReactNode }) {
  const { children } = props;
  const { isTeacher, loading } = useTeacher();

  if (loading) return null;
  if (!isTeacher && !authStore.getUser()?.is_superuser) return <Navigate to="/courses" replace />;

  return <>{children}</>;
}