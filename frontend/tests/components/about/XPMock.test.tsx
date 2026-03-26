import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import XPMock from "@/components/about/XPMock"

describe("XPMock", () => {
  it("renders progress, streak, and summary stats", () => {
    render(<XPMock />)

    expect(screen.getByText("Your Progress")).toBeInTheDocument()
    expect(screen.getByText("Level 12")).toBeInTheDocument()
    expect(screen.getByText("2,340 / 3,800 XP to next level")).toBeInTheDocument()
    expect(screen.getByText("Streak")).toBeInTheDocument()
    expect(screen.getByText("Done")).toBeInTheDocument()
    expect(screen.getByText("This week")).toBeInTheDocument()
    expect(screen.getByText("142")).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
  })
})
