import { HomeNavbar, Footer, LogoutMessage } from "@/components"

/**
 * Logs the user out on mount and redirects to the login screen.
 */
export default function Logout() {
  return (
    <>
      <HomeNavbar />
        <LogoutMessage/>
      <Footer />
    </>
  )
}
