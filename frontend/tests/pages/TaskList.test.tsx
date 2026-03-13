import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskList from "@/pages/TaskList";
import { MemoryRouter } from "react-router-dom";
import type { useTaskList as useTaskListOriginal } from "@/hooks/tasks/useTaskList";

vi.mock("@/hooks/tasks/useTaskList", () => ({
  useTaskList: vi.fn(),
}));

import { useTaskList } from "@/hooks/tasks/useTaskList";

type UseTaskListReturn = ReturnType<typeof useTaskListOriginal>;

vi.mock("@/components/tasks/TaskListToolbar", () => ({
  default: (props: { onSearchChange: (v: string) => void; onToggleHighImportance: () => void; onToggleQuickWins: () => void }) => (
    <div>
      <input data-testid="search-input" onChange={(e) => props.onSearchChange(e.target.value)} />
      <button onClick={() => props.onToggleHighImportance()}>Toggle High</button>
      <button onClick={() => props.onToggleQuickWins()}>Toggle Quick</button>
    </div>
  ),
}));

vi.mock("@/components", () => ({
  TaskListSection: ({
    onToggleComplete,
    onTaskClick,
    tasks,
    title,
  }: {
    onToggleComplete: (id: number) => void;
    onTaskClick: (t: { id: number; title: string }) => void;
    tasks: { id: number; title: string }[];
    title: string;
  }) => (
    <div data-testid={`section-${title}`}>
      {tasks.map((t) => (
        <div key={t.id}>
          <span onClick={() => onTaskClick(t)}>{t.title}</span>
          <button onClick={() => onToggleComplete(t.id)}>Complete {t.id}</button>
        </div>
      ))}
    </div>
  ),
  UnifiedSidebar: ({
    isOpen,
    onClose,
    onSubmitTask,
    onDelete,
    initialData,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmitTask: (data: { title: string }) => void;
    onDelete: () => void;
    initialData?: { id: number };
  }) =>
    isOpen ? (
      <div data-testid="sidebar">
        <button onClick={onClose}>Close Sidebar</button>
        <button onClick={() => onSubmitTask({ title: "New" })}>Submit Sidebar</button>
        {initialData && <button onClick={() => onDelete()}>Delete Sidebar</button>}
      </div>
    ) : null,
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("TaskList Page", () => {
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
    closeSidebar: vi.fn(),
    submitTask: vi.fn(),
    deleteTask: vi.fn(),
    refresh: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    updateTaskCategories: vi.fn(),
  };

  const mockState = {
    tasks: [],
    categories: [],
    isSidebarOpen: false,
    selectedTask: undefined,
    search: "",
    sortBy: "date",
    filters: { category: null, completed: "all" as const, highImportance: false, quickWins: false },
    sections: {
      pastTasks: [],
      overdueTasks: [],
      todayTasks: [],
      upcomingTasks: [],
      completedTasks: [],
      groupedUpcomingTasks: {},
      sortedUpcomingDates: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaskList).mockReturnValue({
      state: mockState as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    });
  });

  it("renders and handles header actions", () => {
    render(
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("New"));
    expect(mockActions.openNewTask).toHaveBeenCalled();
  });

  it("handles toolbar actions", () => {
    render(
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "test" } });
    expect(mockActions.setSearch).toHaveBeenCalledWith("test");

    fireEvent.click(screen.getByText("Toggle High"));
    expect(mockActions.toggleFilterHighImportance).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Toggle Quick"));
    expect(mockActions.toggleFilterQuickWins).toHaveBeenCalled();
  });

  it("handles task section actions (Overdue, Upcoming, Completed)", () => {
    const baseTask = {
      importance: 5,
      completed: false,
      start_time: "2023-01-01",
      deadline: "2023-01-01",
      categories: [],
      user: 1,
      allocation: [],
      description: "",
      estimated_minutes: 30,
    };
    const tasks = [
      { id: 1, title: "Overdue Task", ...baseTask },
      { id: 2, title: "Upcoming Task", ...baseTask },
      { id: 3, title: "Completed Task", ...baseTask },
    ];

    vi.mocked(useTaskList).mockReturnValue({
      state: {
        ...mockState,
        sections: {
          ...mockState.sections,
          pastTasks: [],
          overdueTasks: [tasks[0]],
          todayTasks: [],
          upcomingTasks: [tasks[1]],
          completedTasks: [tasks[2]],
          groupedUpcomingTasks: {},
          sortedUpcomingDates: [],
        },
      } as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    });

    render(
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Overdue Task"));
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[0]);
    fireEvent.click(screen.getByText("Complete 1"));
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Upcoming Task"));
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[1]);
    fireEvent.click(screen.getByText("Complete 2"));
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText("Completed Task"));
    expect(mockActions.openTask).toHaveBeenCalledWith(tasks[2]);
    fireEvent.click(screen.getByText("Complete 3"));
    expect(mockActions.toggleComplete).toHaveBeenCalledWith(3);
  });

  it("handles sidebar actions", () => {
    const editingTask = {
      id: 5,
      title: "Editing",
      importance: 5,
      completed: false,
      start_time: "2023-01-01",
      deadline: "2023-01-01",
      categories: [],
      user: 1,
      allocation: [],
      description: "",
      estimated_minutes: 30,
    };

    vi.mocked(useTaskList).mockReturnValue({
      state: {
        ...mockState,
        isSidebarOpen: true,
        selectedTask: editingTask,
      } as UseTaskListReturn["state"],
      loading: false,
      error: null,
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    });

    render(
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Close Sidebar"));
    expect(mockActions.closeSidebar).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Submit Sidebar"));
    expect(mockActions.submitTask).toHaveBeenCalledWith({ title: "New" });

    fireEvent.click(screen.getByText("Delete Sidebar"));
    expect(mockActions.deleteTask).toHaveBeenCalledWith(5);
  });

  it("shows loading and error states", () => {
    vi.mocked(useTaskList).mockReturnValue({
      state: mockState as UseTaskListReturn["state"],
      loading: true,
      error: "Failed to load",
      actions: mockActions as unknown as UseTaskListReturn["actions"],
    });

    render(
      <MemoryRouter>
        <TaskList />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading tasks...")).toBeDefined();
    expect(screen.getByText("Failed to load")).toBeDefined();
  });
});
