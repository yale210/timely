import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ComponentProps, ReactNode } from 'react'
import EventForm from "@/components/events/EventForm"
import { type Category, type Event } from "@/types"
import { getServerTime } from "@/services/eventService"

vi.mock("@/services/eventService", () => ({
  getServerTime: vi.fn(),
}))

vi.mock("@/hooks/notifications/usePushSubscription", () => ({
  usePushSubscription: () => ({
    isSubscribed: true,
    permission: "granted",
    subscribe: vi.fn().mockResolvedValue(undefined),
    loading: false,
  }),
}))

vi.mock("@/components", async () => {
  const actual = await vi.importActual<object>("@/components")
  return {
    ...actual,
    Tooltip: ({ children }: { children: ReactNode }) => children,
    CategoryColourPicker: () => null,
    CategoryMultiSelect: ({ categories, selectedIds, onChange }: {
      categories: Category[]
      selectedIds: number[]
      onChange: (nextIds: number[]) => void
    }) => (
      <div>
        <input placeholder="Type to search or add category..." readOnly />
        {categories.map((category) => {
          const isSelected = selectedIds.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                onChange(
                  isSelected
                    ? selectedIds.filter((id) => id !== category.id)
                    : [...selectedIds, category.id],
                )
              }
            >
              {category.text}
            </button>
          )
        })}
      </div>
    ),
  }
})

const toDateInputValue = (value: Date): string => {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toTimeInputValue = (value: Date): string => {
  const hours = `${value.getHours()}`.padStart(2, "0")
  const minutes = `${value.getMinutes()}`.padStart(2, "0")
  return `${hours}:${minutes}`
}

const mockCategories: Category[] = [
  { id: 1, text: 'Work' },
  { id: 2, text: 'Personal' }
]

const mockInitialData: Event = {
  id: 1,
  title: 'Existing Event',
  description: 'Some description',
  location: 'Some place',
  start_time: '2026-02-03T10:00:00Z',
  end_time: '2026-02-03T11:00:00Z',
  categories: [],
  recurrence_interval: 'weekly',
  recurrence_end: '2026-12-31',
  reminders: [
    { id: 1, send_email: false, send_push: true, minutes_before: 30 }
  ]
}

describe('EventForm', () => {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  const onDataChange = vi.fn()
  const onCreateCategory = vi.fn().mockResolvedValue({ id: 3, text: "New" })
  const onUpdateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" })
  const onDeleteCategory = vi.fn().mockResolvedValue(undefined)
  const baseProps: ComponentProps<typeof EventForm> = {
    categories: mockCategories,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
    onSubmit,
    onCancel,
  }

  const renderEventForm = (props: Partial<ComponentProps<typeof EventForm>> = {}) =>
    render(<EventForm {...baseProps} {...props} />)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getServerTime).mockResolvedValue({ server_time: new Date().toISOString() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with initial data', () => {
    renderEventForm({ initialData: mockInitialData })

    expect(screen.getByLabelText(/Title/i)).toHaveValue('Existing Event')
    expect(screen.getByLabelText(/Location/i)).toHaveValue('Some place')
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Some description')
    expect(screen.getByLabelText(/Interval/i)).toHaveValue('weekly')
  })

  it("defaults end date/time to start + 1 hour when start_time exists without end_time", () => {
    const start = new Date("2026-02-15T09:30:00.000Z")
    const expectedEnd = new Date(start.getTime() + (60 * 60 * 1000))

    renderEventForm({
      initialData: {
        id: 0,
        title: "",
        start_time: start.toISOString(),
        categories: [],
        reminders: [],
      } as unknown as Event,
    })

    expect(screen.getByLabelText(/Start Date/i)).toHaveValue(toDateInputValue(start))
    expect(screen.getByLabelText(/End Date/i, { selector: "#event-end-date" })).toHaveValue("")
    expect(screen.getByLabelText(/End Time/i)).toHaveValue(toTimeInputValue(expectedEnd))
  })

  it('calls onCancel when cancel button is clicked', () => {
    renderEventForm()

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onSubmit with form data', () => {
    renderEventForm()

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Event' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'New Place' } })
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '11:00' } })
    
    fireEvent.submit(screen.getByRole('button', { name: /Save Event/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Event',
      location: 'New Place'
    }))
  })

  it("disables Save Event until at least one field changes", () => {
    const editableInitialData: Event = {
      ...mockInitialData,
      reminders: [],
    }

    renderEventForm({ initialData: editableInitialData })

    const saveButton = screen.getByRole("button", { name: /Save Event/i })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Existing Event Updated" } })
    expect(saveButton).not.toBeDisabled()
  })

  it('validates time (start before end)', () => {
    renderEventForm()

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '11:00' } })

    expect(screen.getByText(/Start time must be before end time/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Event/i })).toBeDisabled()
  })

  it('allows recurrence without end date (never)', () => {
    renderEventForm()

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-02-10' } })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '11:00' } })

    // Set a recurrence interval
    fireEvent.click(screen.getByRole("button", { name: /recurring/i }))
    fireEvent.change(screen.getByLabelText(/Interval/i), { target: { value: 'daily' } })
    
    // With new requirement, recurrence end is optional (defaults to "Never")
    // The form should still be submittable
    expect(screen.getByRole('button', { name: /Save Event/i })).not.toBeDisabled()
  })

  it('manages reminders', () => {
    renderEventForm()

    fireEvent.click(screen.getByText(/Add Reminder/i))
    expect(screen.getByText(/minutes/i)).toBeInTheDocument()

    const emailCheckbox = screen.getAllByLabelText(/Email/i)[0]
    fireEvent.click(emailCheckbox)

    const minutesInput = screen.getAllByDisplayValue('15')
    fireEvent.change(minutesInput[0], { target: { value: '45' } })

    fireEvent.click(screen.getByText(/delete/i))
    expect(screen.queryByText(/minutes/i)).not.toBeInTheDocument()
  })

  it('calls onDataChange when fields change', () => {
    renderEventForm({ onDataChange })

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Changed' } })
    expect(onDataChange).toHaveBeenCalled()
  })

  it('handles category selection via checkboxes', async () => {
    renderEventForm()

    fireEvent.focus(screen.getByPlaceholderText(/Type to search or add category/i))
    const workOption = await screen.findByText(/Work/i)
    fireEvent.click(workOption)

    fireEvent.focus(screen.getByPlaceholderText(/Type to search or add category/i))
    fireEvent.click(await screen.findByText(/Work/i))
  })

  it('limits reminders to 5', () => {
    renderEventForm()

    // Add 5 reminders
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText(/Add Reminder/i))
    }

    // Check that the header shows 5/5
    expect(screen.getByText(/Reminders \(5\/5\)/i)).toBeInTheDocument()
    
    // The Add Reminder button should be disabled
    const addButton = screen.getByText(/Add Reminder/i)
    expect(addButton).toHaveClass('cursor-not-allowed')
  })

  it('handles all field changes', () => {
    renderEventForm()

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-04' } })
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/End Date/i, { selector: '#event-end-date' }), { target: { value: '2026-02-04' } })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '11:00' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'New Location' } })
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Description' } })
    
    fireEvent.submit(screen.getByRole('button', { name: /Save Event/i }))
    
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      location: 'New Location',
      description: 'New Description'
    }))
  })

  it('handles recurrence interval change', () => {
    renderEventForm()

    fireEvent.click(screen.getByRole("button", { name: /recurring/i }))
    const intervalSelect = screen.getByLabelText(/Interval/i)
    fireEvent.change(intervalSelect, { target: { value: 'weekly' } })
    expect(intervalSelect).toHaveValue('weekly')

    fireEvent.change(intervalSelect, { target: { value: 'monthly' } })
    expect(intervalSelect).toHaveValue('monthly')
  })

  it("shows a warning when client clock is out of sync with server time", async () => {
    vi.mocked(getServerTime).mockResolvedValue({
      server_time: new Date(Date.now() + (6 * 60 * 1000)).toISOString()
    })

    renderEventForm()

    expect(
      await screen.findByText(/device clock appears out of sync with the server/i)
    ).toBeInTheDocument()
  })

  it("uses server-adjusted time for past reminder validation", async () => {
    vi.mocked(getServerTime).mockResolvedValue({
      server_time: new Date(Date.now() + (10 * 60 * 1000)).toISOString()
    })

    const now = new Date()
    const startDate = new Date(now.getTime() + (4 * 60 * 1000))
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000))

    renderEventForm()

    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: toDateInputValue(startDate) } })
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: toTimeInputValue(startDate) } })
    fireEvent.change(screen.getByLabelText(/End Date/i, { selector: "#event-end-date" }), {
      target: { value: toDateInputValue(endDate) },
    })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: toTimeInputValue(endDate) } })

    fireEvent.click(screen.getByText(/Add Reminder/i))
    fireEvent.change(screen.getByDisplayValue("15"), { target: { value: "1" } })

    await waitFor(() => {
      expect(screen.getByText(/This reminder would trigger in the past/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /Save Event/i })).toBeDisabled()
  })
})
