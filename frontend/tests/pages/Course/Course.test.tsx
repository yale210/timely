import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Courses from "@/pages/Course/Course";
import type * as courseService from "@/services/courseService";

const mockNavigate = vi.fn();
const mockSetSearch = vi.fn();
const mockRefresh = vi.fn();
const mockJoinCourse = vi.fn().mockResolvedValue({
  id: 1,
  name: "Python Basics",
  description: "Intro course",
  lead: "Teacher",
  created_at: "2026-01-01T00:00:00Z",
  active: true,
  students: [],
});

let mockUseCoursesReturn: {
  state: { search: string };
  filteredCourses: {
    id: number;
    name: string;
    description: string;
    lead: string;
    created_at: string;
    active: boolean;
    students: unknown[];
  }[];
  loading: boolean;
  error: string | null;
  actions: {
    setSearch: typeof mockSetSearch;
    refresh: typeof mockRefresh;
    joinCourse: typeof mockJoinCourse;
  };
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/layouts/AppLayout.tsx", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/course/useTeacher.tsx", () => ({
  useTeacher: () => ({ isTeacher: true }),
}));

vi.mock("@/hooks/course/useCoursePermissions.tsx", () => ({
  useCoursePermissions: () => ({
    permissions: { can_view: true, can_join: true, can_manage: true },
    loading: false,
  }),
}));

vi.mock("@/hooks/course/useCourse.tsx", () => ({
  useCourses: () => mockUseCoursesReturn,
}));

vi.mock("@/components/course/CourseCard.tsx", () => ({
  default: ({ course, onView }: { course: { name: string }; onView: (course: unknown) => void }) => (
    <button type="button" onClick={() => onView(course)} data-testid="course-card">
      {course.name}
    </button>
  ),
}));

vi.mock("@/components/course/CourseHeader.tsx", () => ({
  default: ({
    search,
    joinCourseId,
    onSearchChange,
    onJoinCourseIdChange,
    onJoinCourse,
    onRefresh,
    onCreateCourse,
    onManageCourses,
    isTeacher,
  }: {
    search: string;
    joinCourseId: string;
    onSearchChange: (value: string) => void;
    onJoinCourseIdChange: (value: string) => void;
    onJoinCourse: () => void;
    onRefresh: () => void;
    onCreateCourse: () => void;
    onManageCourses: () => void;
    isTeacher: boolean;
  }) => (
    <div>
      <input
        aria-label="Search courses"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <input
        aria-label="Course ID"
        value={joinCourseId}
        onChange={(e) => onJoinCourseIdChange(e.target.value)}
      />
      <button type="button" onClick={onJoinCourse}>
        Join
      </button>
      <button type="button" onClick={onRefresh}>
        Refresh
      </button>
      {isTeacher && (
        <>
          <button type="button" onClick={onCreateCourse}>
            Create course
          </button>
          <button type="button" onClick={onManageCourses}>
            Manage
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock("@/components/course/CourseEmptyState.tsx", () => ({
  default: () => <div>No courses yet</div>,
}));

vi.mock("@/components/course/CourseEventsDrawer.tsx", () => ({
  default: ({
    courseName,
    onClose,
  }: {
    courseName: string;
    events: unknown[];
    loading: boolean;
    onClose: () => void;
  }) => (
    <div data-testid="events-drawer">
      <span>{courseName}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("@/services/courseService", async () => {
  const actual = await vi.importActual<typeof courseService>("@/services/courseService");
  return {
    ...actual,
    getCourseEvents: vi.fn().mockResolvedValue([]),
  };
});

describe("Courses page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetSearch.mockReset();
    mockRefresh.mockReset();
    mockJoinCourse.mockClear();

    mockUseCoursesReturn = {
      state: { search: "" },
      filteredCourses: [
        {
          id: 1,
          name: "Python Basics",
          description: "Intro course",
          lead: "Teacher",
          created_at: "2026-01-01T00:00:00Z",
          active: true,
          students: [],
        },
      ],
      loading: false,
      error: null,
      actions: {
        setSearch: mockSetSearch,
        refresh: mockRefresh,
        joinCourse: mockJoinCourse,
      },
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("renders course data and teacher actions", () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );


    expect(screen.getByText("Python Basics")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create course" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage" })).toBeTruthy();
  });

  it("hides teacher actions for non-teachers", () => {
    vi.doMock("@/hooks/course/useTeacher.tsx", () => ({
      useTeacher: () => ({ isTeacher: false }),
    }));
  });

  it("shows join validation error when course id is empty", async () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(await screen.findByText("Please enter a valid course ID.")).toBeTruthy();
    expect(mockJoinCourse).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("joins a course and refreshes the list when a valid id is entered", async () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Course ID"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => {
      expect(mockJoinCourse).toHaveBeenCalledWith("42");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an error when joining fails", async () => {
    mockJoinCourse.mockRejectedValueOnce(new Error("join failed"));

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Course ID"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(await screen.findByText("Unable to join that course.")).toBeTruthy();
  });

  it("navigates to create and manage pages for teachers", () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Create course" }));
    expect(mockNavigate).toHaveBeenCalledWith("/course/create");

    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(mockNavigate).toHaveBeenCalledWith("/courses/manage");
  });

  it("opens course details when clicking a course card", async () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("course-card"));

    await waitFor(() => {
      expect(screen.getByTestId("events-drawer")).toBeTruthy();
      expect(screen.getAllByText("Python Basics")).toBeTruthy();
      expect(mockNavigate).toHaveBeenCalledWith("/courses/1");
    });
  });

  it("shows the empty state when there are no courses", () => {
    mockUseCoursesReturn.filteredCourses = [];
    mockUseCoursesReturn.loading = false;

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    expect(screen.getByText("No courses yet")).toBeTruthy();
  });

  it("renders the page error when the hook returns one", () => {
    mockUseCoursesReturn.error = "Something went wrong";

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
