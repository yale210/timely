import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import EventList from "@/pages/EventList"
import * as eventService from "@/services/eventService"
import * as taskService from "@/services/taskService"
import { MemoryRouter } from 'react-router-dom'
import moment from 'moment'

import { type Event, type EventSubmission } from "@/types"

vi.mock("@/services/eventService")
vi.mock("@/services/taskService")

interface MockSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvent: (data: EventSubmission) => void;
  onDelete?: () => void;
  initialData?: Event;
}

// Mock UnifiedSidebar to avoid testing it here
vi.mock("@/components", async () => {
  const actual = await vi.importActual("@/components");
  return {
    ...actual,
    UnifiedSidebar: vi.fn(({ isOpen, onClose, onSubmitEvent, onDelete, initialData }: MockSidebarProps) => (
      isOpen ? (
        <div data-testid="mock-sidebar">
          <button onClick={onClose}>Close</button>
          <button onClick={() => onSubmitEvent({ title: 'New Event' })}>Submit</button>
          {initialData && onDelete && <button onClick={onDelete}>Delete</button>}
        </div>
      ) : null
    ))
  }
})

const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Past Event',
    start_time: moment().subtract(1, 'day').toISOString(),
    end_time: moment().subtract(1, 'day').add(1, 'hour').toISOString(),
    location: 'Old Place',
    importance: 5,
    reminders: [],
    categories: []
  },
  {
    id: 2,
    title: 'Today Event',
    start_time: moment().toISOString(),
    end_time: moment().add(1, 'hour').toISOString(),
    location: 'Current Place',
    importance: 5,
    reminders: [],
    categories: []
  },
  {
    id: 3,
    title: 'Upcoming Event',
    start_time: moment().add(1, 'day').toISOString(),
    end_time: moment().add(1, 'day').add(1, 'hour').toISOString(),
    location: 'Future Place',
    importance: 5,
    reminders: [],
    categories: []
  }
]

describe('EventList', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    vi.mocked(taskService.getCategories).mockResolvedValue([])
  })

  it('renders events correctly', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())
    expect(screen.getByText('Upcoming Event')).toBeDefined()
    // Past event is collapsed by default
    expect(screen.queryByText('Past Event')).toBeNull()
  })

  it('toggles past events', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const toggleButton = await screen.findByRole('button', { name: /Past Events/i })
    fireEvent.click(toggleButton)

    expect(screen.getByText('Past Event')).toBeDefined()

    fireEvent.click(toggleButton)
    expect(screen.queryByText('Past Event')).toBeNull()
  })

  it('opens sidebar for new event', () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const newEventButton = screen.getAllByText(/New Event/i)[0]
    fireEvent.click(newEventButton)

    expect(screen.getByTestId('mock-sidebar')).toBeDefined()
  })

  it('opens sidebar for editing event', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const eventItem = await screen.findByText('Today Event')
    fireEvent.click(eventItem)

    expect(screen.getByTestId('mock-sidebar')).toBeDefined()
    expect(screen.getByText('Delete')).toBeDefined()
  })

  it('handles event submission', async () => {
    vi.mocked(eventService.createEvent).mockResolvedValue({ id: 4, title: 'New Event', start_time: '', end_time: '', importance: 5, reminders: [], categories: [] })
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    fireEvent.click(screen.getAllByText(/New Event/i)[0])
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(eventService.createEvent).toHaveBeenCalled())
    expect(eventService.getEvents).toHaveBeenCalledTimes(2)
  })

  it('handles event update', async () => {
    vi.mocked(eventService.updateEvent).mockResolvedValue({ id: 2, title: 'Updated Event', start_time: '', end_time: '', importance: 5, reminders: [], categories: [] })
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const eventItem = await screen.findByText('Today Event')
    fireEvent.click(eventItem)
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(eventService.updateEvent).toHaveBeenCalledWith(2, expect.anything()))
  })

  it('handles event deletion', async () => {
    vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined)
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const eventItem = await screen.findByText('Today Event')
    fireEvent.click(eventItem)
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => expect(eventService.deleteEvent).toHaveBeenCalledWith(2))
  })

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* ignore */ })
    vi.mocked(eventService.getEvents).mockRejectedValue(new Error('Fetch failed'))
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    consoleSpy.mockRestore()
  })

  it('handles submission errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* ignore */ })
    vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Submit failed'))
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    fireEvent.click(screen.getAllByText(/New Event/i)[0])
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    consoleSpy.mockRestore()
  })

  it('handles deletion errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* ignore */ })
    vi.mocked(eventService.deleteEvent).mockRejectedValue(new Error('Delete failed'))
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    const eventItem = await screen.findByText('Today Event')
    fireEvent.click(eventItem)
    fireEvent.click(screen.getByText('Delete'))

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    consoleSpy.mockRestore()
  })

  it('renders empty states', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue([])
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('No events scheduled for today.')).toBeDefined())
    expect(screen.getByText('No upcoming events.')).toBeDefined()
    
    const toggleButton = screen.getByRole('button', { name: /Past Events/i })
    fireEvent.click(toggleButton)
    expect(screen.getByText('No past events.')).toBeDefined()
  })
})
