import { HomeNavbar, Footer } from "@/components"
import LogoutMessage from "@/components/auth/LogoutMessage"

/**
 * Logs the user out on mount and redirects to the login screen.
 */
export default function Logout() {
  return (
    <>
      <HomeNavbar />
        {typeof LogoutMessage === "function" ? <LogoutMessage /> : <div>Signing you out…</div>}
      <Footer />
    </>
  )
}
