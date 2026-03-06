import type { ReactNode } from "react"
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskList from "@/pages/TaskList"
import { MemoryRouter } from 'react-router-dom'
import type { useTaskList as useTaskListOriginal } from "@/hooks/tasks/useTaskList"

// Mock the hook
vi.mock("@/hooks/tasks/useTaskList", () => ({
  useTaskList: vi.fn()
}))

import { useTaskList } from "@/hooks/tasks/useTaskList"

type UseTaskListReturn = ReturnType<typeof useTaskListOriginal>;

// Mock child components correctly
vi.mock("@/components/tasks/TaskListHeader", () => ({
  default: ({ onNewTask }: { onNewTask: () => void }) => <button onClick={onNewTask}>New Task Header</button>
}))

vi.mock("@/components/tasks/TaskListToolbar", () => ({
  default: (props: { onSearchChange: (v: string) => void, onToggleHighImportance: () => void, onToggleQuickWins: () => void }) => (
    <div>
      <input data-testid="search-input" onChange={(e) => props.onSearchChange(e.target.value)} />
      <button onClick={() => props.onToggleHighImportance()}>Toggle High</button>
      <button onClick={() => props.onToggleQuickWins()}>Toggle Quick</button>
    </div>
  )
}))

// TaskList.tsx imports TaskListSection and TaskSidebar from "@/components"
vi.mock("@/components", () => ({
  TaskListSection: ({ onToggleComplete, onTaskClick, tasks, title }: { onToggleComplete: (id: number) => void, onTaskClick: (t: { id: number, title: string }) => void, tasks: { id: number, title: string }[], title: string }) => (
    <div data-testid={`section-${title}`}>
      {tasks.map((t) => (
        <div key={t.id}>
          <span onClick={() => onTaskClick(t)}>{t.title}</span>
          <button onClick={() => onToggleComplete(t.id)}>Complete {t.id}</button>
        </div>
      ))}
    </div>
  ),
  TaskSidebar: ({ isOpen, onClose, onSubmit, onDelete, initialData }: { isOpen: boolean, onClose: () => void, onSubmit: (data: { title: string }) => void, onDelete: (id: number) => void, initialData?: { id: number } }) => isOpen ? (
    <div data-testid="sidebar">
      <button onClick={onClose}>Close Sidebar</button>
      <button onClick={() => onSubmit({ title: 'New' })}>Submit Sidebar</button>
      {initialData && <button onClick={() => onDelete(initialData.id)}>Delete Sidebar</button>}
    </div>
  ) : null
}))

vi.mock("@/components/tasks/TaskUpcomingSection", () => ({
  default: ({ onToggleComplete, onTaskClick, upcomingTasks }: { onToggleComplete: (id: number) => void, onTaskClick: (t: { id: number, title: string }) => void, upcomingTasks: { id: number, title: string }[] }) => (
    <div data-testid="upcoming-section">
      {upcomingTasks.map((t) => (
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
    refresh: vi.fn(),
  }

  const mockState = {
    tasks: [],
    categories: [],
    isSidebarOpen: false,
    selectedTask: undefined,
    search: '',
    sortBy: 'date',
    filters: { category: null, completed: 'all' as const, highImportance: false, quickWins: false },
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
      state: mockState as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    })
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

  it('handles task section actions (Today, Overdue, Past, Upcoming)', () => {
    const baseTask = {
      importance: 5,
      completed: false,
      start_time: '2023-01-01',
      deadline: '2023-01-01',
      categories: [],
      user: 1,
      allocation: [],
      description: '',
      estimated_minutes: 30,
    };
    const tasks = [
      { id: 1, title: 'Today Task', ...baseTask },
      { id: 2, title: 'Overdue Task', ...baseTask },
      { id: 3, title: 'Past Task', ...baseTask },
      { id: 4, title: 'Upcoming Task', ...baseTask },
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
      } as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    })

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
    const editingTask = {
      id: 5,
      title: 'Editing',
      importance: 5,
      completed: false,
      start_time: '2023-01-01',
      deadline: '2023-01-01',
      categories: [],
      user: 1,
      allocation: [],
      description: '',
      estimated_minutes: 30,
    };
    vi.mocked(useTaskList).mockReturnValue({
      state: {
        ...mockState,
        isSidebarOpen: true,
        selectedTask: editingTask
      } as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    })

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
      state: mockState as UseTaskListReturn["state"],
      loading: true,
      error: 'Failed to load',
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    })

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

