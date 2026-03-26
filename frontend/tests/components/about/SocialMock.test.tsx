import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import SocialMock from "@/components/about/SocialMock"

describe("SocialMock", () => {
  it("renders leaderboard entries including the current user", () => {
    render(<SocialMock />)

    expect(screen.getByText("Leaderboard")).toBeInTheDocument()
    expect(screen.getByText("Alex K.")).toBeInTheDocument()
    expect(screen.getByText("Sam T.")).toBeInTheDocument()
    expect(screen.getByText("Jordan M.")).toBeInTheDocument()
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.getByText("Priya L.")).toBeInTheDocument()
    expect(screen.getByText("5,670 XP")).toBeInTheDocument()
  })
})
