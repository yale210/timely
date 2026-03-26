import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import CalendarMock from "@/components/about/CalendarMock"

describe("CalendarMock", () => {
  it("renders the weekly agenda preview", () => {
    render(<CalendarMock />)

    expect(screen.getByText("Weekly Agenda")).toBeInTheDocument()

    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }

    expect(screen.getAllByText("Study")).toHaveLength(2)
    expect(screen.getAllByText("Lecture")).toHaveLength(2)
    expect(screen.getByText("Deadline")).toBeInTheDocument()
  })
})
