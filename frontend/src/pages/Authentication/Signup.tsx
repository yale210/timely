import { HomeNavbar, Footer, BlurBackground, SignupForm } from "@/components/index"

/**
 * A functional component that renders the signup page.
 * @returns The rendered signup page component.
 */
export default function Signup() {
  return (
    <>
      <HomeNavbar/>
        <SignupForm>
          <BlurBackground/>
        </SignupForm>
      <Footer/>
    </>
  )
}
