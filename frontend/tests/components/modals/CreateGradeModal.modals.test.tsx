import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CreateGradeModal from "@/components/modals/CreateGradeModal"
import useCategories from "@/hooks/tasks/useCategories"

// Mock useCategories hook used by the modal
vi.mock("@/hooks/tasks/useCategories", () => ({
  default: vi.fn(),
}))

describe("CreateGradeModal (modals path)", () => {
  const mockCategories = [
    { id: 1, text: "Math" },
    { id: 2, text: "Science" },
  ]

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreated: vi.fn(),
    onUpdated: vi.fn(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCategories).mockReturnValue({ categories: mockCategories, loading: false })

    fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response)
    vi.stubGlobal("fetch", fetchSpy as unknown as typeof fetch)

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrftoken=testtoken",
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("does not render when closed", () => {
    render(<CreateGradeModal {...defaultProps} open={false} />)
    expect(screen.queryByText("Create grade")).not.toBeInTheDocument()
  })

  it("renders and submits in create mode", async () => {
    render(<CreateGradeModal {...defaultProps} />)

    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Exam A" } })
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "80" } })
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } })
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "1" } })

    const dateInput = document.getElementById("grade-date-input") as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: "2023-12-01" } })

    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
      expect(defaultProps.onCreated).toHaveBeenCalled()
    })
  })
})
