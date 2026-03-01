import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { HomeNavbar, Footer, LogoutMessage } from "@/components"
import { authService } from "@/services/authService"

/**
 * Logs the user out on mount and redirects to the login screen.
 */
export default function Logout() {
  const navigate = useNavigate()
  const [message, setMessage] = useState("Signing you out...")

  useEffect(() => {
    let cancelled = false

    void authService
      .logout()
      .catch((err: unknown) => {
        const text = err instanceof Error ? err.message : "Logout failed"
        if (!cancelled) setMessage(text)
      })
      .finally(() => {
        if (!cancelled) void navigate("/login", { replace: true })
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <>
      <HomeNavbar />
        <LogoutMessage message={message}/>
      <Footer />
    </>
  )
}
