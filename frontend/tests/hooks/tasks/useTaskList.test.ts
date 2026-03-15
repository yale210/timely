import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useTaskList } from "@/hooks/tasks/useTaskList";
import * as taskService from "@/services/taskService";
import type { Task, TaskSubmission } from "@/types";
import moment from "moment";

// Mock services
vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
  getCategories: vi.fn(),
  updateTask: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
}));

// Mock useThemeFont to avoid errors
vi.mock("@/hooks/common/useThemeFont", () => ({
  useThemeFont: vi.fn(),
}));

describe("useTaskList Hook", () => {
  const today = moment().endOf('day').toISOString();
  const yesterday = moment().subtract(1, 'day').startOf('day').toISOString();
  const tomorrow = moment().add(1, 'day').startOf('day').toISOString();
  const twoDaysAgo = moment().subtract(2, 'days').startOf('day').toISOString();

  const mockTasks = [
    { id: 1, title: "Task 1", deadline: today, importance: 5, estimated_minutes: 20, completed: false },
    { id: 2, title: "Task 2", deadline: yesterday, importance: 9, estimated_minutes: 40, completed: false },
    { id: 3, title: "Task 3", deadline: tomorrow, importance: 2, estimated_minutes: 10, completed: false },
    { id: 4, title: "Task 4", deadline: twoDaysAgo, importance: 1, estimated_minutes: 15, completed: true },
  ] as Task[];

  const mockCategories = [{ id: 1, text: "Cat 1" }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
    vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches tasks and categories on mount", async () => {
    const { result } = renderHook(() => useTaskList());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.state.tasks).toEqual(mockTasks);
    });

    expect(taskService.getTasks).toHaveBeenCalled();
  });

  it("filters tasks based on search string", async () => {
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.setSearch("Task 1");
    });

    // Check filtered results - only Task 1 matches
    const filtered = result.current.state.sections.todayTasks;
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Task 1");
  });

  it("groups tasks into correct sections", async () => {
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { sections } = result.current.state;
    expect(sections.todayTasks.length).toBe(1);
    expect(sections.overdueTasks.length).toBe(1);
    expect(sections.upcomingTasks.length).toBe(1);
    expect(sections.pastTasks.length).toBe(1);
  });

  it("handles toggleComplete", async () => {
    vi.mocked(taskService.updateTask).mockResolvedValue({} as Task);
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.actions.toggleComplete(1);
    });

    expect(taskService.updateTask).toHaveBeenCalledWith(1, { completed: true });
  });

  it("handles submitTask (create)", async () => {
    vi.mocked(taskService.createTask).mockResolvedValue({} as Task);
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newTask = { title: "New", deadline: today, importance: 5, estimated_minutes: 10 } as TaskSubmission;
    await act(async () => {
      await result.current.actions.submitTask(newTask);
    });

    expect(taskService.createTask).toHaveBeenCalledWith(newTask);
  });

  it("handles submitTask (update)", async () => {
    vi.mocked(taskService.updateTask).mockResolvedValue({} as Task);
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.openTask(mockTasks[0]);
    });

    const updatedData = { title: "Updated" } as TaskSubmission;
    await act(async () => {
      await result.current.actions.submitTask(updatedData);
    });

    expect(taskService.updateTask).toHaveBeenCalledWith(mockTasks[0].id, updatedData);
  });

  it("handles deleteTask", async () => {
    vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.actions.deleteTask(1);
    });

    expect(taskService.deleteTask).toHaveBeenCalledWith(1);
  });

  it("toggles filters and sorting correctly", async () => {
    const { result } = renderHook(() => useTaskList());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.setSortBy("importance");
      result.current.actions.setFilterCategory(1);
      result.current.actions.setFilterCompleted("completed");
    });

    expect(result.current.state.sortBy).toBe("importance");
    expect(result.current.state.filters.category).toBe(1);
    expect(result.current.state.filters.completed).toBe("completed");
    
    // Check toggle actions
    act(() => {
        result.current.actions.toggleFilterHighImportance();
        result.current.actions.toggleFilterQuickWins();
    });
    expect(result.current.state.filters.highImportance).toBe(true);
    expect(result.current.state.filters.quickWins).toBe(true);
  });

  it("formats day labels correctly", () => {
    const { result } = renderHook(() => useTaskList());
    const tomorrowStr = moment().add(1, 'day').toISOString();
    expect(result.current.actions.formatDayLabel(tomorrowStr)).toBe("Tomorrow");
    
    const otherDate = moment().add(2, 'days').toISOString();
    expect(result.current.actions.formatDayLabel(otherDate)).toBe(moment(otherDate).format("ddd D MMM"));
  });
});

