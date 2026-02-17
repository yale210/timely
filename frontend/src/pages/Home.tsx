import { Navbar, Footer, BlurBackground, HeroSection } from "@/components/index"
import heroImage from "@/assets/hero-content-img.svg"
import { Link } from "react-router-dom"

/**
 * A functional component that renders the homepage of the application.
 * @returns The rendered homepage component.
 */
export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />
        <HeroSection blurBackground={<BlurBackground />}/>
      <Footer />
    </div>

  )
}
