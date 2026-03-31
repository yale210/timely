import type * as ReactRouterDom from "react-router-dom";
import type * as CourseService from "@/services/courseService";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CourseDetail from "@/pages/Course/CourseDetail.tsx";
import * as courseService from "@/services/courseService";

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

const { mockGetUser } = vi.hoisted(() => ({
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
    getUser: () => mockGetUser() as { id: number; is_admin: boolean },
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

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/courses/1"]}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CourseDetail page modals and actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockGetUser.mockReturnValue({
      id: 10,
      is_admin: false,
    } as never);

    vi.mocked(courseService.getCourse).mockResolvedValue(mockCourse as never);
    vi.mocked(courseService.getCourseEvents).mockResolvedValue([] as never);
  });

  it("opens and closes the edit modal", async () => {
    renderPage();

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

  it("saves course successfully", async () => {
    vi.mocked(courseService.updateCourse).mockResolvedValue({
      ...mockCourse,
      name: "New Name",
    } as never);

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Edit course" }));
    fireEvent.change(screen.getByLabelText("Course name"), {
      target: { value: "New Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(vi.mocked(courseService.updateCourse)).toHaveBeenCalledWith(1, {
        name: "New Name",
        description: "Intro course",
        active: true,
      });
      expect(screen.queryByLabelText("Course name")).toBeNull();
    });
  });

  it("handles course save error", async () => {
    vi.mocked(courseService.updateCourse).mockRejectedValue(new Error("save error"));

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Edit course" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Unable to save changes.")).toBeTruthy();
  });

  it("creates event successfully", async () => {
    vi.mocked(courseService.createCourseEvent).mockResolvedValue({} as never);

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Test Event" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create event" }));

    await waitFor(() => {
      expect(vi.mocked(courseService.createCourseEvent)).toHaveBeenCalled();
      expect(screen.queryByLabelText("Title")).toBeNull();
    });
  });

  it("handles event creation error", async () => {
    vi.mocked(courseService.createCourseEvent).mockRejectedValue(new Error("create error"));

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    fireEvent.click(screen.getByRole("button", { name: "Create event" }));

    expect(await screen.findByText("Unable to create event.")).toBeTruthy();
  });

  it("creates join code successfully", async () => {
    vi.mocked(courseService.createJoinCode).mockResolvedValue({
      code: "JOIN-123",
    } as never);

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Create join code" }));
    fireEvent.click(screen.getByRole("button", { name: "Create code" }));

    await waitFor(() => {
      expect(vi.mocked(courseService.createJoinCode)).toHaveBeenCalled();
    });

    expect(await screen.findByText("JOIN-123")).toBeTruthy();
  });

  it("handles join code creation error", async () => {
    vi.mocked(courseService.createJoinCode).mockRejectedValue(
      new Error("join code error"),
    );

    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Create join code" }));
    fireEvent.change(screen.getByLabelText("Expires at"), {
      target: { value: "2026-12-31T00:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create code" }));

    expect(await screen.findByText("Unable to create join code.")).toBeTruthy();
  });

  it("allows changing all form fields in edit course modal", async () => {
    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Edit course" }));

    fireEvent.change(screen.getByLabelText("Course name"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "B" },
    });
    fireEvent.click(screen.getByLabelText("Active course"));

    expect(screen.getByLabelText("Course name")).toHaveValue("A");
    expect(screen.getByLabelText("Description")).toHaveValue("B");
    expect(screen.getByLabelText("Active course")).not.toBeChecked();
  });

  it("allows changing all form fields in add event modal", async () => {
    renderPage();

    await screen.findAllByText("Python Basics");
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "D" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "L" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "2026-01-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "2026-01-01T11:00" },
    });

    expect(screen.getByLabelText("Title")).toHaveValue("T");
    expect(screen.getByLabelText("Description")).toHaveValue("D");
    expect(screen.getByLabelText("Location")).toHaveValue("L");
    expect(screen.getByLabelText("Start time")).toHaveValue("2026-01-01T10:00");
    expect(screen.getByLabelText("End time")).toHaveValue("2026-01-01T11:00");
  });
});