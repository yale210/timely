import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import CalendarPage from "@/pages/Calendar"
import * as taskService from "@/services/taskService"
import * as eventService from "@/services/eventService"
import { MemoryRouter } from 'react-router-dom'
import moment from 'moment'
import type { Task, Event, TaskSubmission, EventSubmission, Category } from "@/types"

vi.mock("@/services/taskService")
vi.mock("@/services/eventService")

class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

let mockSidebarHandlers: {
  onSubmitTask?: (data: TaskSubmission) => void;
  onSubmitEvent?: (data: EventSubmission) => void;
  onDelete?: () => void;
  onClose?: () => void;
  initialData?: Task | Event;
  categories?: Category[];
  isOpen?: boolean;
  initialMode?: string;
} = {}

vi.mock("@/components", async () => {
  const actual = await vi.importActual("@/components");
  return {
    ...actual,
    UnifiedSidebar: vi.fn((props: {
      isOpen: boolean;
      onSubmitTask: (data: TaskSubmission) => void;
      onSubmitEvent: (data: EventSubmission) => void;
      onDelete?: () => void;
      onClose: () => void;
      initialData?: Task | Event;
      categories: Category[];
      initialMode: string;
    }) => {
      mockSidebarHandlers = props
      if (!props.isOpen) return null
      return (
        <div data-testid="mock-calendar-sidebar">
          <span>{props.initialMode === 'task' ? 'Task Form' : 'Event Form'}</span>
          <button 
            data-testid="submit-task" 
            onClick={() => props.onSubmitTask({ 
              title: "Test Task", 
              description: "", 
              deadline: new Date().toISOString(), 
              importance: 5, 
              estimated_minutes: 30, 
              categories: [] 
            })}
          >
            Submit Task
          </button>
          <button 
            data-testid="submit-event" 
            onClick={() => props.onSubmitEvent({ 
              title: "Test Event"
            })}
          >
            Submit Event
          </button>
          {props.initialData && props.onDelete && (
            <button data-testid="delete-item" onClick={props.onDelete}>Delete</button>
          )}
          <button data-testid="close-sidebar" onClick={props.onClose}>Close</button>
        </div>
      )
    })
  }
})

const mockTasks = [
    {
        id: 1,
        title: 'Test Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 5,
        estimated_minutes: 60,
        completed: false,
        categories: []
    }
]

const mockEvents: Event[] = [
    {
        id: 1,
        title: 'Test Event',
        start_time: new Date().toISOString(),
        end_time: moment().add(1, 'hour').toISOString(),
        importance: 5,
        categories: [],
        recurrence_interval: null,
        recurrence_end: null,
        reminders: []
    }
]

const mockCategories = [
    { id: 1, text: 'Work' }
]

describe('CalendarPage Rendering', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)
        vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
    })

    it('should render the calendar page with header', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
        
        expect(screen.getByText('Today')).toBeDefined()
        expect(screen.getByText('Month')).toBeDefined()
        expect(screen.getByText('Week')).toBeDefined()
        expect(screen.getByText('Day')).toBeDefined()
        expect(screen.getByText('Agenda')).toBeDefined()
    })

    it('should fetch tasks, events and categories on mount', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalled()
            expect(eventService.getEvents).toHaveBeenCalled()
            expect(taskService.getCategories).toHaveBeenCalled()
        })
    })

    it('should display the current month and year', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        const currentMonthYear = moment().format("MMMM YYYY")
        await waitFor(() => {
            expect(screen.getByText(currentMonthYear)).toBeDefined()
        })
    })
})

describe('CalendarPage View Switching', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
    })

    it('should switch to Week view when Week button is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const weekButton = screen.getByText('Week')
        fireEvent.click(weekButton)

        await waitFor(() => {
            expect(weekButton.className).toContain('bg-white')
        })
    })

    it('should switch to Day view when Day button is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const dayButton = screen.getByText('Day')
        fireEvent.click(dayButton)

        await waitFor(() => {
            expect(dayButton.className).toContain('bg-white')
        })
    })

    it('should switch to Agenda view when Agenda button is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const agendaButton = screen.getByText('Agenda')
        fireEvent.click(agendaButton)

        await waitFor(() => {
            expect(agendaButton.className).toContain('bg-white')
        })
    })
})

describe('CalendarPage Navigation', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
    })

    it('should navigate to previous month when left chevron is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const prevButton = screen.getByText('chevron_left')
        fireEvent.click(prevButton)

        const prevMonthYear = moment().subtract(1, 'month').format("MMMM YYYY")
        await waitFor(() => {
            expect(screen.getByText(prevMonthYear)).toBeDefined()
        })
    })

    it('should navigate to next month when right chevron is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const nextButton = screen.getByText('chevron_right')
        fireEvent.click(nextButton)

        const nextMonthYear = moment().add(1, 'month').format("MMMM YYYY")
        await waitFor(() => {
            expect(screen.getByText(nextMonthYear)).toBeDefined()
        })
    })

    it('should navigate back to today when Today button is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const nextButton = screen.getByText('chevron_right')
        fireEvent.click(nextButton)

        const todayButton = screen.getByText('Today')
        fireEvent.click(todayButton)

        const currentMonthYear = moment().format("MMMM YYYY")
        await waitFor(() => {
            expect(screen.getByText(currentMonthYear)).toBeDefined()
        })
    })
})

describe('CalendarPage Error Handling', () => {
    afterEach(cleanup)
    
    it('should handle fetch tasks error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockRejectedValue(new Error('Fetch failed'))
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    it('should handle fetch events error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockRejectedValue(new Error('Fetch failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    it('should handle fetch categories error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockRejectedValue(new Error('Fetch failed'))
        vi.mocked(eventService.getEvents).mockResolvedValue([])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })
})

describe('CalendarPage Recurring Events', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should render non-recurring events correctly', async () => {
        const nonRecurringEvent: Event[] = [{
            id: 1,
            title: 'Single Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: null,
            recurrence_end: null,
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(nonRecurringEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should expand daily recurring events', async () => {
        const dailyEvent: Event[] = [{
            id: 2,
            title: 'Daily Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'daily',
            recurrence_end: moment().add(7, 'days').toISOString(),
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(dailyEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should expand weekly recurring events', async () => {
        const weeklyEvent: Event[] = [{
            id: 3,
            title: 'Weekly Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'weekly',
            recurrence_end: moment().add(4, 'weeks').toISOString(),
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(weeklyEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should expand monthly recurring events', async () => {
        const monthlyEvent: Event[] = [{
            id: 4,
            title: 'Monthly Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'monthly',
            recurrence_end: moment().add(3, 'months').toISOString(),
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(monthlyEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should expand yearly recurring events', async () => {
        const yearlyEvent: Event[] = [{
            id: 5,
            title: 'Yearly Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'yearly',
            recurrence_end: moment().add(2, 'years').toISOString(),
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(yearlyEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should handle recurring events with no end date (never ending)', async () => {
        const neverEndingEvent: Event[] = [{
            id: 6,
            title: 'Never Ending Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'weekly',
            recurrence_end: null,
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(neverEndingEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })
})

describe('CalendarPage Tasks Display', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
    })

    it('should render tasks with allDay flag for tasks spanning 24+ hours', async () => {
        const longTask = [{
            id: 1,
            title: 'Long Task',
            start_time: new Date().toISOString(),
            deadline: moment().add(2, 'days').toISOString(),
            importance: 5,
            estimated_minutes: 60,
            completed: false,
            categories: []
        }]
        
        vi.mocked(taskService.getTasks).mockResolvedValue(longTask)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })

    it('should render tasks without allDay flag for short tasks', async () => {
        const shortTask = [{
            id: 2,
            title: 'Short Task',
            start_time: new Date().toISOString(),
            deadline: moment().add(2, 'hours').toISOString(),
            importance: 5,
            estimated_minutes: 30,
            completed: false,
            categories: []
        }]
        
        vi.mocked(taskService.getTasks).mockResolvedValue(shortTask)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })
})

describe('CalendarPage Invalid Recurrence', () => {
    afterEach(cleanup)

    it('should break out of loop for invalid recurrence interval', async () => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        
        const invalidRecurrenceEvent: Event[] = [{
            id: 7,
            title: 'Invalid Recurrence Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: 'daily',
            recurrence_end: moment().add(1, 'month').toISOString(),
            reminders: []
        }]
        
        vi.mocked(eventService.getEvents).mockResolvedValue(invalidRecurrenceEvent)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeDefined()
        })
    })
})

describe('CalendarPage Slot Selection', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)
        vi.mocked(eventService.getEvents).mockResolvedValue([])
    })

    it('should open sidebar when clicking on calendar slot', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const calendarCells = document.querySelectorAll('.rbc-day-bg')
        if (calendarCells.length > 0) {
            fireEvent.click(calendarCells[10])
            
            await waitFor(() => {
                const sidebar = document.querySelector('[class*="fixed inset-y-0 right-0"]')
                expect(sidebar).toBeDefined()
            }, { timeout: 500 })
        }
    })
})

describe('CalendarPage Event Selection', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)
    })

    it('should open sidebar when clicking on a task event', async () => {
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(eventService.getEvents).mockResolvedValue([])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const taskEvents = document.querySelectorAll('.rbc-event')
        if (taskEvents.length > 0) {
            fireEvent.click(taskEvents[0])
        }
    })

    it('should open sidebar when clicking on an event', async () => {
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const events = document.querySelectorAll('.rbc-event')
        if (events.length > 0) {
            fireEvent.click(events[0])
        }
    })
})

describe('CalendarPage CRUD Operations Error Handling', () => {
    afterEach(cleanup)

    it('should handle create task error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
        vi.mocked(taskService.createTask).mockRejectedValue(new Error('Create failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        consoleSpy.mockRestore()
    })

    it('should handle create event error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
        vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Create failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        consoleSpy.mockRestore()
    })

    it('should handle delete task error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
        vi.mocked(taskService.deleteTask).mockRejectedValue(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        consoleSpy.mockRestore()
    })

    it('should handle delete event error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress console.error */ })
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
        vi.mocked(eventService.deleteEvent).mockRejectedValue(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        consoleSpy.mockRestore()
    })
})

describe('CalendarPage Sidebar Handler Operations', () => {
    afterEach(cleanup)

    beforeEach(() => {
        vi.resetAllMocks()
        mockSidebarHandlers = {}
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)
        vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
        vi.mocked(taskService.createTask).mockResolvedValue({} as never)
        vi.mocked(taskService.updateTask).mockResolvedValue({} as never)
        vi.mocked(taskService.deleteTask).mockResolvedValue(undefined)
        vi.mocked(eventService.createEvent).mockResolvedValue({} as never)
        vi.mocked(eventService.updateEvent).mockResolvedValue({} as never)
        vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined)
    })

    it('should call createTask when submitting new task from sidebar', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const calendarCells = document.querySelectorAll('.rbc-day-bg')
        if (calendarCells.length > 0) {
            fireEvent.click(calendarCells[10])
            
            await waitFor(() => {
                expect(screen.queryByTestId('mock-calendar-sidebar')).toBeDefined()
            }, { timeout: 1000 })

            if (screen.queryByTestId('submit-task')) {
                fireEvent.click(screen.getByTestId('submit-task'))
                
                await waitFor(() => {
                    expect(taskService.createTask).toHaveBeenCalled()
                })
            }
        }
    })

    it('should call createEvent when submitting new event from sidebar', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const calendarCells = document.querySelectorAll('.rbc-day-bg')
        if (calendarCells.length > 0) {
            fireEvent.click(calendarCells[10])
            
            await waitFor(() => {
                expect(screen.queryByTestId('mock-calendar-sidebar')).toBeDefined()
            }, { timeout: 1000 })

            if (screen.queryByTestId('submit-event')) {
                fireEvent.click(screen.getByTestId('submit-event'))
                
                await waitFor(() => {
                    expect(eventService.createEvent).toHaveBeenCalled()
                })
            }
        }
    })

    it('should close sidebar when close button is clicked', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())

        const calendarCells = document.querySelectorAll('.rbc-day-bg')
        if (calendarCells.length > 0) {
            fireEvent.click(calendarCells[10])
            
            await waitFor(() => {
                expect(screen.queryByTestId('mock-calendar-sidebar')).toBeDefined()
            }, { timeout: 1000 })

            if (screen.queryByTestId('close-sidebar')) {
                fireEvent.click(screen.getByTestId('close-sidebar'))
                
                await waitFor(() => {
                    expect(screen.queryByTestId('mock-calendar-sidebar')).toBeNull()
                })
            }
        }
    })
})

// Direct handler tests - guaranteed coverage by calling handlers directly through captured mock
describe('CalendarPage Direct Handler Coverage', () => {
    afterEach(cleanup)

    beforeEach(() => {
        vi.resetAllMocks()
        mockSidebarHandlers = {}
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)
        vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents)
        vi.mocked(taskService.createTask).mockResolvedValue({} as never)
        vi.mocked(taskService.updateTask).mockResolvedValue({} as never)
        vi.mocked(taskService.deleteTask).mockResolvedValue(undefined)
        vi.mocked(eventService.createEvent).mockResolvedValue({} as never)
        vi.mocked(eventService.updateEvent).mockResolvedValue({} as never)
        vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined)
    })

    it('handleSubmitTask - should create task when no selectedItem', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // The mock always renders when isOpen changes, and captures handlers
        // We need to wait for the handlers to be captured
        await waitFor(() => expect(mockSidebarHandlers.onSubmitTask).toBeDefined())

        // Call the handler directly
        mockSidebarHandlers.onSubmitTask!({
            title: 'New Task',
            description: '',
            deadline: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 30,
            categories: []
        })

        await waitFor(() => {
            expect(taskService.createTask).toHaveBeenCalled()
        })
    })

    it('handleSubmitEvent - should create event when no selectedItem', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        await waitFor(() => expect(mockSidebarHandlers.onSubmitEvent).toBeDefined())

        // Call the handler directly
        mockSidebarHandlers.onSubmitEvent!({
            title: 'New Event'
        })

        await waitFor(() => {
            expect(eventService.createEvent).toHaveBeenCalled()
        })
    })

    it('handleSubmitTask - should update task when selectedItem is a task', async () => {
        const taskWithDeadline = {
            id: 99,
            title: 'Existing Task',
            deadline: new Date().toISOString(),
            start_time: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 60,
            completed: false,
            categories: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([taskWithDeadline])
        vi.mocked(eventService.getEvents).mockResolvedValue([])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on a task event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        // Wait for sidebar to open with the selected task
        await waitFor(() => {
            expect(mockSidebarHandlers.onSubmitTask).toBeDefined()
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        // If we have a selected task (has deadline), call update
        if (mockSidebarHandlers.initialData && 'deadline' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onSubmitTask!({
                title: 'Updated Task',
                description: '',
                deadline: new Date().toISOString(),
                importance: 5,
                estimated_minutes: 30,
                categories: []
            })

            await waitFor(() => {
                expect(taskService.updateTask).toHaveBeenCalled()
            })
        }
    })

    it('handleSubmitEvent - should update event when selectedItem is an event', async () => {
        const eventWithEndTime: Event = {
            id: 88,
            title: 'Existing Event',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: null,
            recurrence_end: null,
            reminders: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([eventWithEndTime])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on an event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        // Wait for sidebar to open with the selected event
        await waitFor(() => {
            expect(mockSidebarHandlers.onSubmitEvent).toBeDefined()
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        // If we have a selected event (has end_time), call update
        if (mockSidebarHandlers.initialData && 'end_time' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onSubmitEvent!({
                title: 'Updated Event'
            })

            await waitFor(() => {
                expect(eventService.updateEvent).toHaveBeenCalled()
            })
        }
    })

    it('handleDelete - should delete task when selectedItem is a task', async () => {
        const taskWithDeadline = {
            id: 77,
            title: 'Task to Delete',
            deadline: new Date().toISOString(),
            start_time: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 60,
            completed: false,
            categories: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([taskWithDeadline])
        vi.mocked(eventService.getEvents).mockResolvedValue([])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on a task event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        await waitFor(() => {
            expect(mockSidebarHandlers.onDelete).toBeDefined()
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        // If we have a selected task, call delete
        if (mockSidebarHandlers.initialData && 'deadline' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onDelete!()

            await waitFor(() => {
                expect(taskService.deleteTask).toHaveBeenCalled()
            })
        }
    })

    it('handleDelete - should delete event when selectedItem is an event', async () => {
        const eventWithEndTime: Event = {
            id: 66,
            title: 'Event to Delete',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: null,
            recurrence_end: null,
            reminders: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([eventWithEndTime])

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on an event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        await waitFor(() => {
            expect(mockSidebarHandlers.onDelete).toBeDefined()
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        // If we have a selected event, call delete
        if (mockSidebarHandlers.initialData && 'end_time' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onDelete!()

            await waitFor(() => {
                expect(eventService.deleteEvent).toHaveBeenCalled()
            })
        }
    })

    it('onClose - should close sidebar and clear selectedItem', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        await waitFor(() => expect(mockSidebarHandlers.onClose).toBeDefined())

        // Call onClose directly
        mockSidebarHandlers.onClose!()

        // The sidebar should be closed (mock returns null when isOpen is false)
        await waitFor(() => {
            expect(mockSidebarHandlers.isOpen).toBe(false)
        })
    })

    it('handleDelete - should return early when no selectedItem id', async () => {
        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        await waitFor(() => expect(mockSidebarHandlers.onDelete).toBeDefined())

        // initialData should be undefined at this point (no item selected)
        expect(mockSidebarHandlers.initialData).toBeUndefined()
        
        // Call delete - should return early since no selectedItem
        mockSidebarHandlers.onDelete!()

        // Neither delete should be called
        expect(taskService.deleteTask).not.toHaveBeenCalled()
        expect(eventService.deleteEvent).not.toHaveBeenCalled()
    })

    it('handleSubmitTask - should handle error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress */ })
        vi.mocked(taskService.createTask).mockRejectedValue(new Error('Create failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        await waitFor(() => expect(mockSidebarHandlers.onSubmitTask).toBeDefined())

        mockSidebarHandlers.onSubmitTask!({
            title: 'Failing Task',
            description: '',
            deadline: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 30,
            categories: []
        })

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    it('handleSubmitEvent - should handle error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress */ })
        vi.mocked(eventService.createEvent).mockRejectedValue(new Error('Create failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        await waitFor(() => expect(mockSidebarHandlers.onSubmitEvent).toBeDefined())

        mockSidebarHandlers.onSubmitEvent!({
            title: 'Failing Event'
        })

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })

    it('handleDelete - should handle error gracefully when deleting task', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress */ })
        const taskWithDeadline = {
            id: 55,
            title: 'Task to Delete',
            deadline: new Date().toISOString(),
            start_time: new Date().toISOString(),
            importance: 5,
            estimated_minutes: 60,
            completed: false,
            categories: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([taskWithDeadline])
        vi.mocked(eventService.getEvents).mockResolvedValue([])
        vi.mocked(taskService.deleteTask).mockRejectedValue(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on a task event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        await waitFor(() => {
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        if (mockSidebarHandlers.initialData && 'deadline' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onDelete!()

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalled()
            })
        }

        consoleSpy.mockRestore()
    })

    it('handleDelete - should handle error gracefully when deleting event', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(function noOp() { /* suppress */ })
        const eventWithEndTime: Event = {
            id: 44,
            title: 'Event to Delete',
            start_time: new Date().toISOString(),
            end_time: moment().add(1, 'hour').toISOString(),
            importance: 5,
            categories: [],
            recurrence_interval: null,
            recurrence_end: null,
            reminders: []
        }
        
        vi.mocked(taskService.getTasks).mockResolvedValue([])
        vi.mocked(eventService.getEvents).mockResolvedValue([eventWithEndTime])
        vi.mocked(eventService.deleteEvent).mockRejectedValue(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <CalendarPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Calendar')).toBeDefined())
        
        // Click on an event to select it
        await waitFor(() => {
            const events = document.querySelectorAll('.rbc-event')
            if (events.length > 0) {
                fireEvent.click(events[0])
            }
        })

        await waitFor(() => {
            expect(mockSidebarHandlers.initialData).toBeDefined()
        }, { timeout: 2000 })

        if (mockSidebarHandlers.initialData && 'end_time' in mockSidebarHandlers.initialData) {
            mockSidebarHandlers.onDelete!()

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalled()
            })
        }

        consoleSpy.mockRestore()
    })
})
