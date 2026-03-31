import { HomeNavbar, Footer, BlurBackground, HeroSection } from "@/components/index"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeNavbar />
      <main className="flex-1">
        <HeroSection>
          <BlurBackground/>
        </HeroSection>
      </main>
      <Footer />
    </div>
  )
}
