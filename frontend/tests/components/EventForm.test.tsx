import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import EventForm from "@/components/EventForm"
import { type Category, type Event } from "@/types"

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

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with initial data', () => {
    render(
      <EventForm
        initialData={mockInitialData}
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    expect(screen.getByLabelText(/Title/i)).toHaveValue('Existing Event')
    expect(screen.getByLabelText(/Location/i)).toHaveValue('Some place')
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Some description')
    expect(screen.getByLabelText(/Interval/i)).toHaveValue('weekly')
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onSubmit with form data', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Event' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'New Place' } })
    
    fireEvent.submit(screen.getByRole('button', { name: /Save Event/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Event',
      location: 'New Place'
    }))
  })

  it('validates time (start before end)', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '12:00' } })
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '11:00' } })

    expect(screen.getByText(/Start time must be before end time/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Event/i })).toBeDisabled()
  })

  it('allows recurrence without end date (never)', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // Set a recurrence interval
    fireEvent.change(screen.getByLabelText(/Interval/i), { target: { value: 'daily' } })
    
    // With new requirement, recurrence end is optional (defaults to "Never")
    // The form should still be submittable
    expect(screen.getByRole('button', { name: /Save Event/i })).not.toBeDisabled()
  })

  it('manages reminders', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

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
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onDataChange={onDataChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Changed' } })
    expect(onDataChange).toHaveBeenCalled()
  })

  it('handles category selection via checkboxes', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    // Categories are now checkboxes, not a select
    const workCheckbox = screen.getByLabelText(/Work/i)
    fireEvent.click(workCheckbox)
    expect(workCheckbox).toBeChecked()
    
    // Toggle it off
    fireEvent.click(workCheckbox)
    expect(workCheckbox).not.toBeChecked()
  })

  it('limits reminders to 5', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

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
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'New Location' } })
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-02-04' } })
    fireEvent.change(screen.getByLabelText(/End Date/i, { selector: '#event-end-date' }), { target: { value: '2026-02-04' } })
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Description' } })
    
    fireEvent.submit(screen.getByRole('button', { name: /Save Event/i }))
    
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      location: 'New Location',
      description: 'New Description'
    }))
  })

  it('handles recurrence interval change', () => {
    render(
      <EventForm
        categories={mockCategories}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    )

    const intervalSelect = screen.getByLabelText(/Interval/i)
    fireEvent.change(intervalSelect, { target: { value: 'weekly' } })
    expect(intervalSelect).toHaveValue('weekly')
    
    fireEvent.change(intervalSelect, { target: { value: '' } })
    expect(intervalSelect).toHaveValue('')
  })
})
