import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import GradebookMock from "@/components/about/GradebookMock"

describe("GradebookMock", () => {
  it("renders module grades and the computed average", () => {
    render(<GradebookMock />)

    expect(screen.getByText("Gradebook")).toBeInTheDocument()
    expect(screen.getByText("Avg 79%")).toBeInTheDocument()
    expect(screen.getByText("Algorithms & Data Structures")).toBeInTheDocument()
    expect(screen.getByText("Database Systems")).toBeInTheDocument()
    expect(screen.getByText("Computer Networks")).toBeInTheDocument()
    expect(screen.getByText("Machine Learning")).toBeInTheDocument()
    expect(screen.getByText("91%")).toBeInTheDocument()
  })
})
