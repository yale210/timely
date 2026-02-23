import { HomeNavbar, Footer } from "@/components/index"
import { BlurBackground, HeroSection } from "@/components/index"
import { useEffect } from "react"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");    
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      console.log("loaded saved theme")
    }

    const savedFont = localStorage.getItem("font");
    if (savedFont) {
      document.documentElement.dataset.font = savedFont;
    }
  }, []);

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
