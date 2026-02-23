import { HomeNavbar, Footer } from "@/components/index"
import { BlurBackground, HeroSection } from "@/components/index"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {
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
