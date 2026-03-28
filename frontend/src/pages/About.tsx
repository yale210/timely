import { HomeNavbar, Footer } from "@/components/index"
import { AboutHero, AboutFeatureSection, AboutCta, FEATURES } from "@/components/about"

/**
 * About page showcasing Timely's features with scroll-driven alternating sections.
 * @returns The rendered about page.
 */
export default function About() {
  return (
    <>
      <HomeNavbar />
        <AboutHero />
          {FEATURES.map((feature, i) => (
            <AboutFeatureSection key={feature.id} feature={feature} index={i} />
          ))}
        <AboutCta />
      <Footer />
    </>
  )
}
