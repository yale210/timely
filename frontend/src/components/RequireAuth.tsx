import { Navigate } from "react-router-dom"
import { authStore } from "@/services/authService"
import type { ReactNode } from "react"

/**
 * Route guard that sends unauthenticated users to the login page.
 * @param props Props containing the children to render when authenticated.
 * @param props.children React nodes to render when a token is present.
 */
export default function RequireAuth(props: { children: ReactNode }) {
  const { children } = props
  const token = authStore.getToken()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
