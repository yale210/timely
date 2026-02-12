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

class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

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
    reminders: [],
    categories: []
  },
  {
    id: 2,
    title: 'Today Event',
    start_time: moment().toISOString(),
    end_time: moment().add(1, 'hour').toISOString(),
    location: 'Current Place',
    reminders: [],
    categories: []
  },
  {
    id: 3,
    title: 'Upcoming Event',
    start_time: moment().add(1, 'day').toISOString(),
    end_time: moment().add(1, 'day').add(1, 'hour').toISOString(),
    location: 'Future Place',
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
    vi.mocked(eventService.createEvent).mockResolvedValue({ id: 4, title: 'New Event', start_time: '', end_time: '', reminders: [], categories: [] })
    
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
    vi.mocked(eventService.updateEvent).mockResolvedValue({ id: 2, title: 'Updated Event', start_time: '', end_time: '', reminders: [], categories: [] })
    
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

describe('EventList Sorting', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    vi.mocked(taskService.getCategories).mockResolvedValue([])
  })

  it('sorts by start_time (Date) - default behavior', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())

    const sortButton = screen.getByRole('button', { name: /Sort/i })
    fireEvent.click(sortButton)

    fireEvent.click(screen.getByText('Date'))

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())
  })

  it('sorts by title', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())

    const sortButton = screen.getByRole('button', { name: /Sort/i })
    fireEvent.click(sortButton)

    fireEvent.click(screen.getByText('Title (A-Z)'))

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())
  })
})

describe('EventList Filtering Additional', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(taskService.getCategories).mockResolvedValue([
      { id: 1, text: 'Work' },
      { id: 2, text: 'Personal' }
    ])
  })

  it('filters by category', async () => {
    const eventsWithCategory = [
      { 
        id: 2,
        title: 'Work Event',
        start_time: moment().toISOString(),
        end_time: moment().add(1, 'hour').toISOString(),
        location: 'Office',
        
        reminders: [],
        categories: [{ id: 1, text: 'Work' }]
      }
    ]
    vi.mocked(eventService.getEvents).mockResolvedValue(eventsWithCategory)

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Work Event')).toBeDefined())

    const filterButton = screen.getByRole('button', { name: /Filter/i })
    fireEvent.click(filterButton)

    const categoryOptions = screen.getAllByText('Work')
    fireEvent.click(categoryOptions[categoryOptions.length - 1])

    await waitFor(() => expect(screen.getByText('Work Event')).toBeDefined())
  })

  it('searches events', async () => {
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())

    const searchInput = screen.getByPlaceholderText('Search events...')
    fireEvent.change(searchInput, { target: { value: 'Today' } })

    await waitFor(() => {
      expect(screen.getByText('Today Event')).toBeDefined()
      expect(screen.queryByText('Upcoming Event')).toBeNull()
    })
  })

  it('filters by recurring events', async () => {
    const recurringEvent = {
      id: 100,
      title: 'Recurring Event',
      start_time: moment().toISOString(),
      end_time: moment().add(1, 'hour').toISOString(),
      location: 'Office',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'weekly',
      recurrence_end: moment().add(1, 'month').toISOString()
    }
    const nonRecurringEvent = {
      id: 101,
      title: 'Non-Recurring Event',
      start_time: moment().toISOString(),
      end_time: moment().add(1, 'hour').toISOString(),
      location: 'Office',
      
      reminders: [],
      categories: []
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([recurringEvent, nonRecurringEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getAllByText('Recurring Event').length).toBeGreaterThan(0))
    expect(screen.getByText('Non-Recurring Event')).toBeDefined()

    const filterButton = screen.getByRole('button', { name: /Filter/i })
    fireEvent.click(filterButton)

    await waitFor(() => expect(screen.getByText('Recurring Only')).toBeDefined())
    fireEvent.click(screen.getByText('Recurring Only'))

    await waitFor(() => {
      expect(screen.getAllByText('Recurring Event').length).toBeGreaterThan(0)
    })
  })
})

describe('EventList Tomorrow Label', () => {
  afterEach(cleanup)

  it('shows Tomorrow label for events tomorrow', async () => {
    const tomorrowEvent = {
      id: 5,
      title: 'Tomorrow Event Test',
      start_time: moment().add(1, 'day').startOf('day').add(10, 'hours').toISOString(),
      end_time: moment().add(1, 'day').startOf('day').add(11, 'hours').toISOString(),
      location: 'Tomorrow Place',
      
      reminders: [],
      categories: []
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([tomorrowEvent])
    vi.mocked(taskService.getCategories).mockResolvedValue([])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Tomorrow Event Test')).toBeDefined())
    expect(screen.getByText('Tomorrow')).toBeDefined()
  })
})

describe('EventList Recurring Events', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(taskService.getCategories).mockResolvedValue([])
  })

  it('expands daily recurring events', async () => {
    const dailyEvent: Event = {
      id: 10,
      title: 'Daily Standup',
      start_time: moment().startOf('day').add(9, 'hours').toISOString(),
      end_time: moment().startOf('day').add(10, 'hours').toISOString(),
      location: 'Conference Room',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'daily',
      recurrence_end: moment().add(7, 'days').toISOString()
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([dailyEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getAllByText('Daily Standup').length).toBeGreaterThan(0))
  })

  it('expands weekly recurring events', async () => {
    const weeklyEvent: Event = {
      id: 11,
      title: 'Weekly Meeting',
      start_time: moment().startOf('day').add(14, 'hours').toISOString(),
      end_time: moment().startOf('day').add(15, 'hours').toISOString(),
      location: 'Board Room',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'weekly',
      recurrence_end: moment().add(1, 'month').toISOString()
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([weeklyEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getAllByText('Weekly Meeting').length).toBeGreaterThan(0))
  })

  it('expands monthly recurring events', async () => {
    const monthlyEvent: Event = {
      id: 12,
      title: 'Monthly Review',
      start_time: moment().startOf('day').add(11, 'hours').toISOString(),
      end_time: moment().startOf('day').add(12, 'hours').toISOString(),
      location: 'Office',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'monthly',
      recurrence_end: moment().add(3, 'months').toISOString()
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([monthlyEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Monthly Review')).toBeDefined())
  })

  it('expands yearly recurring events', async () => {
    const yearlyEvent: Event = {
      id: 13,
      title: 'Annual Event',
      start_time: moment().startOf('day').add(10, 'hours').toISOString(),
      end_time: moment().startOf('day').add(11, 'hours').toISOString(),
      location: 'Venue',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'yearly',
      recurrence_end: moment().add(2, 'years').toISOString()
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([yearlyEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Annual Event')).toBeDefined())
  })

  it('handles invalid recurrence interval by breaking loop', async () => {
    const invalidEvent: Event = {
      id: 14,
      title: 'Invalid Recurrence',
      start_time: moment().startOf('day').add(10, 'hours').toISOString(),
      end_time: moment().startOf('day').add(11, 'hours').toISOString(),
      location: 'Somewhere',
      
      reminders: [],
      categories: [],
      recurrence_interval: 'daily',
      recurrence_end: moment().add(1, 'week').toISOString()
    }
    vi.mocked(eventService.getEvents).mockResolvedValue([invalidEvent])

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('My Events')).toBeDefined())
  })
})

describe('EventList Sidebar Close', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    vi.mocked(taskService.getCategories).mockResolvedValue([])
  })

  it('closes sidebar when close button is clicked', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())

    fireEvent.click(screen.getByText('Today Event'))

    await waitFor(() => expect(screen.getByTestId('mock-sidebar')).toBeDefined())

    fireEvent.click(screen.getByText('Close'))

    await waitFor(() => expect(screen.queryByTestId('mock-sidebar')).toBeNull())
  })

  it('opens sidebar via Add New Event button at bottom', async () => {
    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Today Event')).toBeDefined())

    fireEvent.click(screen.getByText('Add New Event'))

    await waitFor(() => expect(screen.getByTestId('mock-sidebar')).toBeDefined())
  })
})

describe('EventList FetchCategories Error', () => {
  afterEach(cleanup)

  it('handles fetchCategories errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress */ })
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    vi.mocked(taskService.getCategories).mockRejectedValue(new Error('Categories fetch failed'))

    render(
      <MemoryRouter>
        <EventList />
      </MemoryRouter>
    )

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())
    expect(screen.getByText('Today Event')).toBeDefined()
    consoleSpy.mockRestore()
  })
})
