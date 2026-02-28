import { Navigate } from "react-router-dom"
import { authStore } from "@/services/authService"
import type { ReactNode } from "react"

/**
 * Route guard that restricts access to staff / admin users.
 * Unauthenticated visitors are sent to /login; authenticated non-staff
 * users are redirected to the home page.
 * @param props Props containing the children to render when authorised.
 * @param props.children React nodes to render when the user is staff.
 */
export default function RequireAdmin(props: { children: ReactNode }) {
  const { children } = props
  const token = authStore.getToken()
  if (!token) return <Navigate to="/login" replace />

  const user = authStore.getUser()
  if (!user?.is_staff) return <Navigate to="/" replace />

  return <>{children}</>
}
