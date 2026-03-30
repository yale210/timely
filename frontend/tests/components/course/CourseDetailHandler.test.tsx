import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CourseDetailHandler from "@/components/course/CourseDetailHandler";

describe("CourseDetailHandler", () => {
  it("shows management buttons and calls their handlers", () => {
    const openJoinCodeModal = vi.fn();
    const openEventModal = vi.fn();
    const openEditModal = vi.fn();

    render(
      <CourseDetailHandler
        courseDetailState={{ leaveLoading: false } as never}
        courseDetailConsts={{
          currentUser: { id: 10, is_admin: false },
        } as never}
        courseDetailHooks={{
          canManageCourse: true,
          openJoinCodeModal,
          openEventModal,
          openEditModal,
          handleLeaveCourse: vi.fn(),
        } as never}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Create join code" }));
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit course" }));

    expect(openJoinCodeModal).toHaveBeenCalledTimes(1);
    expect(openEventModal).toHaveBeenCalledTimes(1);
    expect(openEditModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Leave course" })).toBeNull();
  });

  it("shows the leave button for a non-admin non-manager user", () => {
    const handleLeaveCourse = vi.fn();

    render(
      <CourseDetailHandler
        courseDetailState={{ leaveLoading: false } as never}
        courseDetailConsts={{
          currentUser: { id: 99, is_admin: false },
        } as never}
        courseDetailHooks={{
          canManageCourse: false,
          openJoinCodeModal: vi.fn(),
          openEventModal: vi.fn(),
          openEditModal: vi.fn(),
          handleLeaveCourse,
        } as never}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave course" }));

    expect(handleLeaveCourse).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Create join code" })).toBeNull();
  });

  it("shows the loading state for leave button", () => {
    render(
      <CourseDetailHandler
        courseDetailState={{ leaveLoading: true } as never}
        courseDetailConsts={{
          currentUser: { id: 99, is_admin: false },
        } as never}
        courseDetailHooks={{
          canManageCourse: false,
          openJoinCodeModal: vi.fn(),
          openEventModal: vi.fn(),
          openEditModal: vi.fn(),
          handleLeaveCourse: vi.fn(),
        } as never}
      />
    );

    expect(screen.getByRole("button", { name: "Leaving..." })).toBeTruthy();
  });

  it("renders no action buttons for anonymous non-managers", () => {
    render(
      <CourseDetailHandler
        courseDetailState={{ leaveLoading: false } as never}
        courseDetailConsts={{ currentUser: null } as never}
        courseDetailHooks={{
          canManageCourse: false,
          openJoinCodeModal: vi.fn(),
          openEventModal: vi.fn(),
          openEditModal: vi.fn(),
          handleLeaveCourse: vi.fn(),
        } as never}
      />
    );

    expect(screen.queryByRole("button", { name: "Leave course" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Create join code" })).toBeNull();
  });
});