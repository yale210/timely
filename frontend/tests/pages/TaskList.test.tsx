import { it, describe, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import TaskList from "@/pages/TaskList"
import * as taskService from "@/services/taskService"
import { MemoryRouter } from 'react-router-dom'
import type { TaskSubmission, Task, Category } from "@/types"

vi.mock("@/services/taskService")

// eslint-disable-next-line prefer-const
let mockSidebarProps: {
  onSubmit?: (data: TaskSubmission) => void;
  onDelete?: (id: number) => void;
  onClose?: () => void;
  initialData?: Task;
  categories?: Category[];
  isOpen?: boolean;
} = {}

vi.mock("@/components/TaskSidebar", () => ({
  default: (props: {
    isOpen: boolean;
    onSubmit: (data: TaskSubmission) => void;
    onDelete?: (id: number) => void;
    onClose: () => void;
    initialData?: Task;
    categories: Category[];
  }) => {
    mockSidebarProps = props
    if (!props.isOpen) return null
    return (
      <div data-testid="mock-task-sidebar">
        <span>{props.initialData?.id ? "Edit Task" : "Add New Task"}</span>
        <button 
          data-testid="sidebar-submit" 
          onClick={() => props.onSubmit({ 
            title: "Test Task", 
            description: "", 
            deadline: new Date().toISOString(), 
            importance: 5, 
            estimated_minutes: 30, 
            categories: [] 
          })}
        >
          Submit
        </button>
        {props.initialData?.id && props.onDelete && (
          <button 
            data-testid="sidebar-delete" 
            onClick={() => props.onDelete?.(props.initialData!.id)}
          >
            Delete
          </button>
        )}
        <button data-testid="sidebar-close" onClick={props.onClose}>Close</button>
      </div>
    )
  }
}))

class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserver;

const mockTasks = [
    {
        id: 1,
        title: 'High Importance Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 9,
        estimated_minutes: 60,
        completed: false,
        categories: []
    },
    {
        id: 2,
        title: 'Quick Win Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 3,
        estimated_minutes: 20,
        completed: false,
        categories: []
    },
    {
        id: 3,
        title: 'Normal Task',
        start_time: new Date().toISOString(),
        deadline: new Date().toISOString(),
        importance: 5,
        estimated_minutes: 45,
        completed: false,
        categories: []
    }
]

describe('TaskList Error Handling', () => {
    afterEach(cleanup)

    it('should handle getTasks error gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ })
        vi.mocked(taskService.getTasks).mockRejectedValue(new Error('Fetch failed'))
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled()
        })

        vi.restoreAllMocks()
    })

    it('should handle getCategories error gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ })
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockRejectedValue(new Error('Categories failed'))

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled()
        })

        vi.restoreAllMocks()
    })

    it('should handle toggle complete error gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ })
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(taskService.updateTask).mockRejectedValue(new Error('Toggle failed'))

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled()
        })

        vi.restoreAllMocks()
    })
})

describe('TaskList Filtering', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should filter by High Importance', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Open filter menu - use the one in the header
        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        // Click High Importance Only
        fireEvent.click(screen.getByText(/High Importance Only/i))

        await waitFor(() => expect(screen.queryByText('Quick Win Task')).toBeNull())
        expect(screen.getByText('High Importance Task')).toBeDefined()
        expect(screen.queryByText('Normal Task')).toBeNull()
    })

    it('should filter by Quick Wins', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('Quick Win Task')).toBeDefined())

        // Open filter menu
        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        // Click Quick Wins
        fireEvent.click(screen.getByText(/≤ 30 mins \(Quick wins\)/i))

        await waitFor(() => expect(screen.queryByText('High Importance Task')).toBeNull())
        expect(screen.getByText('Quick Win Task')).toBeDefined()
        expect(screen.queryByText('Normal Task')).toBeNull()
    })
})

describe('TaskList Sorting', () => {
    afterEach(cleanup)
    
    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should sort by Date', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Open sort menu
        const sortButton = screen.getByRole('button', { name: /Sort/i })
        fireEvent.click(sortButton)

        // Click Date option
        fireEvent.click(screen.getByText('Date'))

        // Verify getTasks was called with ordering param
        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ ordering: 'deadline' })
            )
        })
    })

    it('should sort by Importance', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Open sort menu
        const sortButton = screen.getByRole('button', { name: /Sort/i })
        fireEvent.click(sortButton)

        // Click Importance option
        fireEvent.click(screen.getByText('Importance'))

        // Verify getTasks was called with ordering param
        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ ordering: '-importance' })
            )
        })
    })

    it('should sort by Estimated Time', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Open sort menu
        const sortButton = screen.getByRole('button', { name: /Sort/i })
        fireEvent.click(sortButton)

        // Click Estimated Time option
        fireEvent.click(screen.getByText('Estimated Time'))

        // Verify getTasks was called with ordering param
        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ ordering: 'estimated_minutes' })
            )
        })
    })
})

describe('TaskList Upcoming Tasks', () => {
    afterEach(cleanup)

    it('should display upcoming tasks grouped by date', async () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(12, 0, 0, 0)
        
        const upcomingTasks = [
            {
                id: 10,
                title: 'Tomorrow Task',
                start_time: tomorrow.toISOString(),
                deadline: tomorrow.toISOString(),
                importance: 5,
                estimated_minutes: 30,
                completed: false,
                categories: []
            }
        ]
        
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(upcomingTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Tomorrow Task')).toBeDefined()
        })
        
        expect(screen.getByText('Tomorrow')).toBeDefined()
        expect(screen.getByText('Upcoming')).toBeDefined()
    })

    it('should display overdue tasks section for past incomplete tasks', async () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 2)
        pastDate.setHours(12, 0, 0, 0)
        
        const overdueTasks = [
            {
                id: 11,
                title: 'Overdue Task',
                start_time: pastDate.toISOString(),
                deadline: pastDate.toISOString(),
                importance: 7,
                estimated_minutes: 45,
                completed: false,
                categories: []
            }
        ]
        
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(overdueTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Overdue Task')).toBeDefined()
        })
        
        expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
    })
})

describe('TaskList Search', () => {
    afterEach(cleanup)

    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
    })

    it('should filter tasks by search term', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // All tasks should be visible
        expect(screen.getByText('Quick Win Task')).toBeDefined()
        expect(screen.getByText('Normal Task')).toBeDefined()

        // Type in search box
        const searchInput = screen.getByPlaceholderText('Search tasks...')
        fireEvent.change(searchInput, { target: { value: 'High' } })

        // Only matching task should be visible
        await waitFor(() => {
            expect(screen.getByText('High Importance Task')).toBeDefined()
            expect(screen.queryByText('Quick Win Task')).toBeNull()
            expect(screen.queryByText('Normal Task')).toBeNull()
        })
    })
})

describe('TaskList Toggle Complete', () => {
    afterEach(cleanup)

    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(taskService.updateTask).mockResolvedValue({} as never)
    })

    it('should toggle task completion when checkbox is clicked', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        // Find checkbox for the first task
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBeGreaterThan(0)

        // Click the first checkbox
        fireEvent.click(checkboxes[0])

        // updateTask should be called with completed: true (toggled from false)
        await waitFor(() => {
            expect(taskService.updateTask).toHaveBeenCalledWith(
                expect.any(Number),
                expect.objectContaining({ completed: true })
            )
        })
    })
})

describe('TaskList Sidebar Operations', () => {
    afterEach(cleanup)

    beforeEach(() => {
        vi.resetAllMocks()
        mockSidebarProps = {}
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])
        vi.mocked(taskService.createTask).mockResolvedValue({} as never)
        vi.mocked(taskService.updateTask).mockResolvedValue({} as never)
        vi.mocked(taskService.deleteTask).mockResolvedValue(undefined)
    })

    it('should open sidebar when task card is clicked', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByText('Edit Task')).toBeDefined()
        })
    })

    it('should call createTask when submitting new task', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('New Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-submit')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-submit'))

        await waitFor(() => {
            expect(taskService.createTask).toHaveBeenCalled()
        })
    })

    it('should call updateTask when submitting existing task', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-submit')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-submit'))

        await waitFor(() => {
            expect(taskService.updateTask).toHaveBeenCalled()
        })
    })

    it('should call deleteTask when deleting a task', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-delete')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-delete'))

        await waitFor(() => {
            expect(taskService.deleteTask).toHaveBeenCalledWith(1)
        })
    })

    it('should close sidebar when close button is clicked', async () => {
        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-close')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-close'))

        await waitFor(() => {
            expect(screen.queryByTestId('mock-task-sidebar')).toBeNull()
        })
    })

    it('should handle submit task error gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ })
        vi.mocked(taskService.updateTask).mockRejectedValueOnce(new Error('Submit failed'))

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-submit')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-submit'))

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled()
        })

        vi.restoreAllMocks()
    })

    it('should handle delete task error gracefully', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { /* suppress */ })
        vi.mocked(taskService.deleteTask).mockRejectedValueOnce(new Error('Delete failed'))

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        fireEvent.click(screen.getByText('High Importance Task'))

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-delete')).toBeDefined()
        })

        fireEvent.click(screen.getByTestId('sidebar-delete'))

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled()
        })

        vi.restoreAllMocks()
    })
})

describe('TaskList Past Tasks Section', () => {
    afterEach(cleanup)

    it('should display Past section header for completed tasks from last 7 days', async () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 3)
        pastDate.setHours(12, 0, 0, 0)

        const pastCompletedTasks = [
            {
                id: 20,
                title: 'Past Completed Task',
                start_time: pastDate.toISOString(),
                deadline: pastDate.toISOString(),
                importance: 5,
                estimated_minutes: 30,
                completed: true,
                categories: []
            }
        ]

        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(pastCompletedTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Past (7 days)')).toBeDefined()
        })
        
        expect(screen.getByText('1')).toBeDefined()
    })

    it('should not show completed today task in Today section if in Past', async () => {
        const todayDate = new Date()
        todayDate.setHours(10, 0, 0, 0)

        const todayCompletedTask = [
            {
                id: 21,
                title: 'Completed Today Task',
                start_time: todayDate.toISOString(),
                deadline: todayDate.toISOString(),
                importance: 5,
                estimated_minutes: 30,
                completed: true,
                categories: []
            }
        ]

        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(todayCompletedTask)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Past (7 days)')).toBeDefined()
        })
    })
})

describe('TaskList Category Filter', () => {
    afterEach(cleanup)

    it('should filter by category', async () => {
        const mockCategories = [
            { id: 1, text: 'Work' },
            { id: 2, text: 'Personal' }
        ]
        
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories)

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        fireEvent.click(screen.getByText('Work'))

        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ categories: 1 })
            )
        })
    })

    it('should filter by status completed', async () => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        fireEvent.click(screen.getByText('completed'))

        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ completed: 'true' })
            )
        })
    })

    it('should filter by status pending', async () => {
        vi.resetAllMocks()
        vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks)
        vi.mocked(taskService.getCategories).mockResolvedValue([])

        render(
            <MemoryRouter>
                <TaskList />
            </MemoryRouter>
        )

        await waitFor(() => expect(screen.getByText('High Importance Task')).toBeDefined())

        const filterButton = screen.getByRole('button', { name: /Filter/i })
        fireEvent.click(filterButton)

        fireEvent.click(screen.getByText('pending'))

        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledWith(
                expect.objectContaining({ completed: 'false' })
            )
        })
    })
})
