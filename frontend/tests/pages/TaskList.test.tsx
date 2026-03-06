import type { ReactNode } from "react"
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TaskList from "@/pages/TaskList"
import { MemoryRouter } from 'react-router-dom'

// Mock the hook
vi.mock("@/hooks/tasks/useTaskList", () => ({
  useTaskList: vi.fn()
}))

import { useTaskList } from "@/hooks/tasks/useTaskList"

// Mock child components correctly
vi.mock("@/components/tasks/TaskListHeader", () => ({
  default: ({ onNewTask }: any) => <button onClick={onNewTask}>New Task Header</button>
}))

vi.mock("@/components/tasks/TaskListToolbar", () => ({
  default: (props: any) => (
    <div>
      <input data-testid="search-input" onChange={(e) => props.onSearchChange(e.target.value)} />
      <button onClick={() => props.onToggleHighImportance()}>Toggle High</button>
      <button onClick={() => props.onToggleQuickWins()}>Toggle Quick</button>
    </div>
  )
}))

// TaskList.tsx imports TaskListSection and TaskSidebar from "@/components"
vi.mock("@/components", () => ({
  TaskListSection: ({ onToggleComplete, onTaskClick, tasks, title }: any) => (
    <div data-testid={`section-${title}`}>
      {tasks.map((t: any) => (
        <div key={t.id}>
          <span onClick={() => onTaskClick(t)}>{t.title}</span>
          <button onClick={() => onToggleComplete(t.id)}>Complete {t.id}</button>
        </div>
      ))}
    </div>
  ),
  TaskSidebar: ({ isOpen, onClose, onSubmit, onDelete, initialData }: any) => isOpen ? (
    <div data-testid="sidebar">
      <button onClick={onClose}>Close Sidebar</button>
      <button onClick={() => onSubmit({ title: 'New' })}>Submit Sidebar</button>
      {initialData && <button onClick={() => onDelete(initialData.id)}>Delete Sidebar</button>}
    </div>
  ) : null
}))

vi.mock("@/components/tasks/TaskUpcomingSection", () => ({
  default: ({ onToggleComplete, onTaskClick, upcomingTasks }: any) => (
    <div data-testid="upcoming-section">
      {upcomingTasks.map((t: any) => (
        <div key={t.id}>
          <span onClick={() => onTaskClick(t)}>{t.title}</span>
          <button onClick={() => onToggleComplete(t.id)}>Complete {t.id}</button>
        </div>
      ))}
    </div>
  )
}))

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

describe('TaskList Page', () => {
  const mockActions = {
    openNewTask: vi.fn(),
    setSearch: vi.fn(),
    setSortBy: vi.fn(),
    setFilterCategory: vi.fn(),
    setFilterCompleted: vi.fn(),
    toggleFilterHighImportance: vi.fn(),
    toggleFilterQuickWins: vi.fn(),
    toggleComplete: vi.fn(),
    openTask: vi.fn(),
    formatDayLabel: vi.fn(),
    closeSidebar: vi.fn(),
    submitTask: vi.fn(),
    deleteTask: vi.fn(),
  }

  const mockState = {
    tasks: [],
    categories: [],
    isSidebarOpen: false,
    selectedTask: null,
    search: '',
    sortBy: 'date',
    filters: { category: null, completed: 'all', highImportance: false, quickWins: false },
    sections: {
      pastTasks: [],
      overdueTasks: [],
      todayTasks: [],
      upcomingTasks: [],
      groupedUpcomingTasks: {},
      sortedUpcomingDates: [],
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTaskList).mockReturnValue({
      state: mockState,
      loading: false,
      error: null,
      actions: mockActions,
    } as any)
  })

  it('renders and handles header actions', () => {
    render(<MemoryRouter><TaskList /></MemoryRouter>)
    fireEvent.click(screen.getByText('New Task Header'))
    expect(mockActions.openNewTask).toHaveBeenCalled()
  })

  it('handles toolbar actions', () => {
    render(<MemoryRouter><TaskList /></MemoryRouter>)
    
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } })
    expect(mockActions.setSearch).toHaveBeenCalledWith('test')

    fireEvent.click(screen.getByText('Toggle High'))
    expect(mockActions.toggleFilterHighImportance).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Toggle Quick'))
    expect(mockActions.toggleFilterQuickWins).toHaveBeenCalled()
  })

  it('handles task section actions (Today, Overdue, Past, Upcoming)', async () => {
    const tasks = [
      { id: 1, title: 'Today Task' },
      { id: 2, title: 'Overdue Task' },
      { id: 3, title: 'Past Task' },
      { id: 4, title: 'Upcoming Task' },
    ]
    
    vi.mocked(useTaskList).mockReturnValue({
      state: {
        ...mockState,
        sections: {
          ...mockState.sections,
          todayTasks: [tasks[0]],
          overdueTasks: [tasks[1]],
          pastTasks: [tasks[2]],
          upcomingTasks: [tasks[3]],
        }
      },
      loading: false,
      error: null,
      actions: mockActions,
    } as any)

    render(<MemoryRouter><TaskList /></MemoryRouter>)

    // Trigger Today actions
    fireEvent.click(screen.getByText('Today Task'))
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[0])
    fireEvent.click(screen.getByText('Complete 1'))
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(1)

    // Trigger Overdue actions
    fireEvent.click(screen.getByText('Overdue Task'))
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[1])
    fireEvent.click(screen.getByText('Complete 2'))
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(2)

    // Trigger Past actions
    fireEvent.click(screen.getByText('Past Task'))
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[2])
    fireEvent.click(screen.getByText('Complete 3'))
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(3)

    // Trigger Upcoming actions
    fireEvent.click(screen.getByText('Upcoming Task'))
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[3])
    fireEvent.click(screen.getByText('Complete 4'))
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(4)
  })

  it('handles sidebar actions', () => {
    vi.mocked(useTaskList).mockReturnValue({
      state: {
        ...mockState,
        isSidebarOpen: true,
        selectedTask: { id: 5, title: 'Editing' }
      },
      loading: false,
      error: null,
      actions: mockActions,
    } as any)

    render(<MemoryRouter><TaskList /></MemoryRouter>)

    fireEvent.click(screen.getByText('Close Sidebar'))
    expect(mockActions.closeSidebar).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Submit Sidebar'))
    expect(mockActions.submitTask).toHaveBeenCalledWith({ title: 'New' })

    fireEvent.click(screen.getByText('Delete Sidebar'))
    expect(mockActions.deleteTask).toHaveBeenCalledWith(5)
  })

  it('shows loading and error states', () => {
    vi.mocked(useTaskList).mockReturnValue({
      state: mockState,
      loading: true,
      error: 'Failed to load',
      actions: mockActions,
    } as any)

    render(<MemoryRouter><TaskList /></MemoryRouter>)
    expect(screen.getByText('Loading tasks...')).toBeDefined()
    expect(screen.getByText('Failed to load')).toBeDefined()
  })

  it('triggers bottom add button', () => {
    render(<MemoryRouter><TaskList /></MemoryRouter>)
    fireEvent.click(screen.getByText('Add New Task'))
    expect(mockActions.openNewTask).toHaveBeenCalled()
  })
})
