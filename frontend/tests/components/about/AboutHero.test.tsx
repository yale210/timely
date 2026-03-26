import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import AboutHero from "@/components/about/AboutHero"

vi.mock("@/hooks/common/useReveal", () => ({
  default: () => [null, true] as const,
}))

vi.mock("@/components/layout/BlurBackground", () => ({
  default: () => <div data-testid="blur-background" />,
}))

describe("AboutHero", () => {
  it("renders hero copy, background, and auth links", () => {
    render(
      <MemoryRouter>
        <AboutHero />
      </MemoryRouter>,
    )

    expect(screen.getByTestId("blur-background")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /everything you need to study smarter/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/timely brings together task management/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /^get started$/i })).toHaveAttribute("href", "/signup")
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login")
  })
})
