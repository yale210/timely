import type * as ReactRouterDom from "react-router-dom";
import type * as CourseService from "@/services/courseService";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CourseDetail from "@/pages/Course/CourseDetail.tsx";
import * as courseService from "@/services/courseService";
import { authStore } from "@/services/authService";

const mockNavigate = vi.fn();

const mockCourse = {
  id: 1,
  name: "Python Basics",
  description: "Intro course",
  lead: "10",
  created_at: "2026-01-01T00:00:00Z",
  active: true,
  students: [],
};

const {
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/layouts/AppLayout.tsx", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/course/CourseEventsCalendar.tsx", () => ({
  default: ({
    courseName,
    events,
    inline,
  }: {
    courseName: string;
    events: unknown[];
    inline?: boolean;
  }) => (
    <div data-testid="events-calendar">
      <span>{courseName}</span>
      <span>{inline ? "inline" : "not-inline"}</span>
      <span>{events.length}</span>
    </div>
  ),
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/services/courseService", async () => {
  const actual = await vi.importActual<typeof CourseService>("@/services/courseService");
  return {
    ...actual,
    getCourse: vi.fn(),
    getCourseEvents: vi.fn(),
    updateCourse: vi.fn(),
    createCourseEvent: vi.fn(),
    createJoinCode: vi.fn(),
    leaveCourse: vi.fn(),
  };
});

describe("CourseDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    mockGetUser.mockReturnValue({
      id: 10,
      is_admin: false,
    } as never);

    vi.mocked(courseService.getCourse).mockResolvedValue(mockCourse as never);
    vi.mocked(courseService.getCourseEvents).mockResolvedValue([] as never);
  });

  it("renders the course details for the lead", async () => {
    render(
      <MemoryRouter initialEntries={["/courses/1"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findAllByText("Python Basics")).toBeTruthy();
    expect(screen.getByText("Intro course")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create join code" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add event" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit course" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Leave course" })).toBeNull();

    expect(screen.getByTestId("events-calendar")).toBeTruthy();
    expect(screen.getAllByText("Python Basics")).toBeTruthy();
  });

  it("shows the leave button for non-lead non-admin users", async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(authStore.getUser).mockReturnValue({
      id: 99,
      is_admin: false,
    } as never);

    render(
      <MemoryRouter initialEntries={["/courses/1"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findAllByText("Python Basics");

    expect(screen.getByRole("button", { name: "Leave course" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create join code" })).toBeNull();
  });

  it("shows an error for an invalid course id", async () => {
    render(
      <MemoryRouter initialEntries={["/courses/not-a-number"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Invalid course.")).toBeTruthy();
     
    expect(vi.mocked(courseService.getCourse)).not.toHaveBeenCalled();
  });

  it("shows course not found when loading fails", async () => {
    vi.mocked(courseService.getCourse).mockRejectedValueOnce(new Error("not found"));

    render(
      <MemoryRouter initialEntries={["/courses/1"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Course not found.")).toBeTruthy();
  });

  it("navigates back when leaving the course succeeds", async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(authStore.getUser).mockReturnValue({
      id: 99,
      is_admin: false,
    } as never);
    vi.mocked(courseService.leaveCourse).mockResolvedValue(undefined as never);

    render(
      <MemoryRouter initialEntries={["/courses/1"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findAllByText("Python Basics");

    fireEvent.click(screen.getByRole("button", { name: "Leave course" }));

    await waitFor(() => {
       
      expect(vi.mocked(courseService.leaveCourse)).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith("/courses", { replace: true });
    });
  });

  it("opens and closes the edit modal", async () => {
    render(
      <MemoryRouter initialEntries={["/courses/1"]}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findAllByText("Python Basics");

    fireEvent.click(screen.getByRole("button", { name: "Edit course" }));

    expect(screen.getByRole("heading", { name: "Edit course" })).toBeTruthy();
    expect(screen.getByLabelText("Course name")).toHaveValue("Python Basics");
    expect(screen.getByLabelText("Description")).toHaveValue("Intro course");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Course name")).toBeNull();
    });
  });




});