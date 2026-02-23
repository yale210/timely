import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { MemoryRouter } from "react-router-dom"
import type { Preference, PreferenceUpdate } from "@/types"

// IMPORTANT: adjust import path if yours differs
import Settings from "@/pages/Settings"

// Mock AppLayout to avoid layout complexity
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock authService (logout used in sidebar)
vi.mock("@/services/authService", () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}))

// Mock preferenceService calls
const getMyPreference = vi.fn<Promise<Preference>, []>()
const updateMyPreference = vi.fn<Promise<Preference>, [PreferenceUpdate]>()

vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference,
    updateMyPreference,
  },
}))

describe("Settings page - Scheduling section", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("loads and renders preferences when switching to Scheduling", async () => {
    getMyPreference.mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [3, 6],
    })

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }))

    expect(getMyPreference).toHaveBeenCalledTimes(1)

    // Values should appear
    expect(await screen.findByText(/set your day's start and end/i)).toBeInTheDocument()

    // Inputs use HH:MM (slice(0,5))
    expect(screen.getByLabelText(/day start/i)).toHaveValue("08:00")
    expect(screen.getByLabelText(/day end/i)).toHaveValue("22:00")
    expect(screen.getByLabelText(/max study hours per day/i)).toHaveValue(4)

    // Selected days should have aria-pressed true
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Sat" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "false")
  })

  it("toggles a day and saves updated preference", async () => {
    getMyPreference.mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [3], // Wed
    })

    updateMyPreference.mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [3, 1], // Wed + Mon after save
    })

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }))
    await screen.findByLabelText(/day start/i)

    // Toggle Mon on
    const mon = screen.getByRole("button", { name: "Mon" })
    expect(mon).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(mon)
    expect(mon).toHaveAttribute("aria-pressed", "true")

    // Save
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    await waitFor(() => {
      expect(updateMyPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          day_start: "08:00",
          day_end: "22:00",
          max_hours_study_per_day: 4,
        })
      )
    })
    const payload = updateMyPreference.mock.calls[0]?.[0]
    expect(payload?.days_off).toEqual(expect.arrayContaining([1, 3]))

    // After save resolves, still selected
    expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "true")
  })

  it("renders DRF field errors from API", async () => {
    getMyPreference.mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [],
    })

    // Mimic axios error shape with response.data
    updateMyPreference.mockRejectedValue({
      response: {
        data: {
          max_hours_study_per_day: ["Ensure this value is less than or equal to 24."],
        },
      },
    })

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }))
    await screen.findByLabelText(/max study hours per day/i)

    fireEvent.change(screen.getByLabelText(/max study hours per day/i), { target: { value: "40" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByText(/please fix the highlighted fields/i)).toBeInTheDocument()
    expect(
      await screen.findByText(/Must be 24 or less/i)
    ).toBeInTheDocument()
  })
})
