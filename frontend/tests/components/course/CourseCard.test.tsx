import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CourseCard from "@/components/course/CourseCard";
import { getUsernameById } from "@/services/authService";
import type { Course, CoursePermissions } from "@/types/course";

vi.mock("@/services/authService", async () => {
  const actual = await vi.importActual<typeof import("@/services/authService")>(
    "@/services/authService",
  );

  return {
    ...actual,
    getUsernameById: vi.fn(),
  };
});

const mockedGetUsernameById = vi.mocked(getUsernameById);

const baseCourse: Course = {
  id: 1,
  name: "Biology",
  description: "GCSE Biology course",
  lead: "42",
  created_at: "2025-01-01T10:00:00.000Z",
  students: [],
};

const basePermission: CoursePermissions = {
  can_view_course_details: true,
  can_view_events: false,
  can_create_join_code: false,
  can_change_name: false,
  can_change_description: false,
  can_update_course: false,
  can_destroy_course: false,
  can_manage_staff: false,
  can_join: false,
  can_leave: false,
};

describe("CourseCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders course name and description", async () => {
    mockedGetUsernameById.mockResolvedValue("teacher42");

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.getByText("GCSE Biology course")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("teacher42")).toBeInTheDocument();
    });
  });

  it("loads the lead username using the numeric lead id", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockedGetUsernameById).toHaveBeenCalledWith(42);
    });

    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("shows Unassigned when there is no lead", async () => {
    render(
      <CourseCard
        course={{ ...baseCourse, lead: null }}
        permission={basePermission}
        onView={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
    });

    expect(mockedGetUsernameById).not.toHaveBeenCalled();
  });

  it("falls back to the raw lead value when username loading fails", async () => {
    mockedGetUsernameById.mockRejectedValue(new Error("boom"));

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("calls onView when the card is clicked", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");
    const onView = vi.fn();

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={onView}
      />,
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onView).toHaveBeenCalledWith(baseCourse);
  });

  it("calls onView when Enter is pressed on the card", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");
    const onView = vi.fn();

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={onView}
      />,
    );

    const card = screen.getByRole("button");
    card.focus();

    await userEvent.keyboard("{Enter}");

    expect(onView).toHaveBeenCalledWith(baseCourse);
  });

  it("calls onView when Space is pressed on the card", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");
    const onView = vi.fn();

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={onView}
      />,
    );

    const card = screen.getByRole("button");
    card.focus();

    await userEvent.keyboard(" ");

    expect(onView).toHaveBeenCalledWith(baseCourse);
  });

  it("renders the View button when details are allowed but staff management is not", () => {
    mockedGetUsernameById.mockResolvedValue("alice");

    render(
      <CourseCard
        course={baseCourse}
        permission={{ ...basePermission, can_view_course_details: true, can_manage_staff: false }}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage course" })).not.toBeInTheDocument();
  });

  it("renders the Manage course button when staff management is allowed", () => {
    mockedGetUsernameById.mockResolvedValue("alice");

    render(
      <CourseCard
        course={baseCourse}
        permission={{ ...basePermission, can_manage_staff: true }}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Manage course" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
  });

  it("clicking View calls onView once because propagation is stopped", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");
    const onView = vi.fn();

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={onView}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "View" }));

    expect(onView).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(baseCourse);
  });

  it("clicking Manage course calls onView", async () => {
    mockedGetUsernameById.mockResolvedValue("alice");
    const onView = vi.fn();

    render(
      <CourseCard
        course={baseCourse}
        permission={{ ...basePermission, can_manage_staff: true }}
        onView={onView}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Manage course" }));

    expect(onView).toHaveBeenCalledWith(baseCourse);
  });

  it("renders a created date string", () => {
    mockedGetUsernameById.mockResolvedValue("alice");

    render(
      <CourseCard
        course={baseCourse}
        permission={basePermission}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Created")).toBeInTheDocument();
  });
});