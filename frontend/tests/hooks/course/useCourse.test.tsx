import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCourses } from "@/hooks/course/useCourse";
import * as courseService from "@/services/courseService";
import { authStore } from "@/services/authService";

vi.mock("@/services/courseService", () => ({
  getCourses: vi.fn(),
  getStaff: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  joinCourse: vi.fn(),
  leaveCourse: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: vi.fn(),
  },
}));

describe("useCourses", () => {
  const mockCourses = [
    {
      id: 1,
      name: "Python Basics",
      description: "Intro course",
      lead: "10",
      created_at: "2026-01-01T00:00:00Z",
      active: true,
      students: [],
    },
    {
      id: 2,
      name: "Data Science",
      description: "Learn data analysis",
      lead: "99",
      created_at: "2026-01-02T00:00:00Z",
      active: false,
      students: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(authStore.getUser).mockReturnValue({
      id: 10,
      is_staff: false,
      is_admin: false,
    } as never);

    vi.mocked(courseService.getCourses).mockResolvedValue(mockCourses as never);
    vi.mocked(courseService.createCourse).mockResolvedValue(mockCourses[0] as never);
    vi.mocked(courseService.updateCourse).mockResolvedValue(mockCourses[0] as never);
    vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as never);
    vi.mocked(courseService.joinCourse).mockResolvedValue(mockCourses[0] as never);
    vi.mocked(courseService.leaveCourse).mockResolvedValue(mockCourses[0] as never);
    vi.mocked(courseService.getStaff).mockResolvedValue([] as never);
  });

  it("filters courses by search text", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(courseService.getCourses).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.actions.setSearch("python");
    });

    expect(result.current.filteredCourses).toHaveLength(1);
    expect(result.current.filteredCourses[0].name).toBe("Python Basics");
  });

  it("returns managed courses for the current user", async () => {
    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(courseService.getCourses).toHaveBeenCalledTimes(1);
    });

    expect(result.current.managedFilteredCourses).toHaveLength(1);
    expect(result.current.managedFilteredCourses[0].id).toBe(1);
  });

  it("creates a course and appends it to state", async () => {
    const newCourse = {
      id: 3,
      name: "Algorithms",
      description: "Study algorithms",
      lead: "10",
      created_at: "2026-01-03T00:00:00Z",
      active: true,
      students: [],
    };

    vi.mocked(courseService.createCourse).mockResolvedValueOnce(newCourse as never);

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(courseService.getCourses).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      const created = await result.current.actions.createCourse({
        name: "Algorithms",
        description: "Study algorithms",
      });
      expect(created).toEqual(newCourse);
    });

    expect(result.current.state.courses).toHaveLength(3);
    expect(result.current.state.courses).toContainEqual(newCourse);
  });

  it("sets an error when loading courses fails", async () => {
    vi.mocked(courseService.getCourses).mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useCourses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load courses.");
  });
});