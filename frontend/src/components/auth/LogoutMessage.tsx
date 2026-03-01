import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "@/services/authService"

/**
 * Displays a message for when the user logs out of their account
 * @param root0
 * @param root0.message
 * @param root0
 * @param root0.message
 */
export default function LogoutMessage() {
    
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
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center text-gray-700">{message}</div>
      </main>
  )
}
