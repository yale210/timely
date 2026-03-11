import { HomeNavbar, Footer, BlurBackground, LoginForm } from "@/components/index"

/**
 * A functional component that renders the login page.
 * @returns The rendered login page component.
 */
export default function Login() {
  return (
    <>
      <HomeNavbar />
        <LoginForm>
          <BlurBackground/>
        </LoginForm>
      <Footer />
    </>
  )
}


