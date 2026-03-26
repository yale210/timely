import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import AboutCta from "@/components/about/AboutCta"

vi.mock("@/hooks/common/useReveal", () => ({
  default: () => [null, true] as const,
}))

describe("AboutCta", () => {
  it("renders the CTA copy and auth links", () => {
    render(
      <MemoryRouter>
        <AboutCta />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("heading", { name: /ready to take control of your time\?/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/join students who plan smarter, study better/i),
    ).toBeInTheDocument()

    expect(screen.getByRole("link", { name: /create your free account/i })).toHaveAttribute(
      "href",
      "/signup",
    )
    expect(screen.getByRole("link", { name: /already have an account\? log in/i })).toHaveAttribute(
      "href",
      "/login",
    )
  })
})
