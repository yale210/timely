import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import TasksMock from "@/components/about/TasksMock"

describe("TasksMock", () => {
  it("renders the upcoming tasks preview", () => {
    render(<TasksMock />)

    expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument()
    expect(screen.getByText("See all")).toBeInTheDocument()
    expect(screen.getByText("Algorithms Assignment")).toBeInTheDocument()
    expect(screen.getByText("Research Paper Draft")).toBeInTheDocument()
    expect(screen.getByText("Lab Report Submission")).toBeInTheDocument()
    expect(screen.getByText("Revision Session")).toBeInTheDocument()
    expect(screen.getByText("Today, 5:00 PM")).toBeInTheDocument()
    expect(screen.getByText("Tomorrow, 11:59 PM")).toBeInTheDocument()
  })
})
