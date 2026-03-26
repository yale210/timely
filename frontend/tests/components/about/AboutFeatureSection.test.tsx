import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import AboutFeatureSection from "@/components/about/AboutFeatureSection"
import { FEATURES } from "@/components/about/aboutFeatures"

vi.mock("@/hooks/common/useReveal", () => ({
  default: () => [null, true] as const,
}))

describe("AboutFeatureSection", () => {
  it("renders feature copy and matching mockup content", () => {
    const feature = FEATURES[0]

    render(<AboutFeatureSection feature={feature} index={0} />)

    expect(screen.getByText(feature.subtitle)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: feature.title })).toBeInTheDocument()
    expect(screen.getByText(feature.description)).toBeInTheDocument()

    for (const highlight of feature.highlights) {
      expect(screen.getByText(highlight)).toBeInTheDocument()
    }

    expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument()
  })

  it("alternates the section background for odd rows", () => {
    const feature = FEATURES[1]
    const { container } = render(<AboutFeatureSection feature={feature} index={1} />)

    expect(container.querySelector("section")).toHaveClass("bg-gray-50")
  })
})
