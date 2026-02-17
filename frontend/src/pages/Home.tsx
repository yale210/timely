import { useEffect, useState } from "react"
import { HomeNavbar, Footer } from "@/components/index"
import { Link, Navigate } from "react-router-dom"
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService"
import { BlurBackground, HeroSection } from "@/components/index"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {
  const [isAuthed, setIsAuthed] = useState(Boolean(authStore.getToken()))

  useEffect(() => {
    const syncAuthState = () => setIsAuthed(Boolean(authStore.getToken()))
    window.addEventListener("storage", syncAuthState)
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuthState)
    return () => {
      window.removeEventListener("storage", syncAuthState)
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthState)
    }
  }, [])

  if (isAuthed) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <HomeNavbar />
        <HeroSection>
          <BlurBackground/>
        </HeroSection>
      <Footer />
    </>
  )
}
