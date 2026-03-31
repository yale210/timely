import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CourseManagementTable from "@/components/course/CourseManagementTable";

const courses = [
  {
    id: 1,
    name: "Python Basics",
    description: "Intro course",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Archived Course",
    description: "",
    active: false,
    created_at: "2026-02-01T00:00:00Z",
  },
];

describe("CourseManagementTable", () => {
  it("renders course rows and status labels", () => {
    render(
      <CourseManagementTable
        courses={courses as never}
        courseManagementState={{
          setStudentsTarget: vi.fn(),
          setDeleteTarget: vi.fn(),
        } as never}
        onOpenEditModal={vi.fn()}
      />
    );

    expect(screen.getByText("Python Basics")).toBeTruthy();
    expect(screen.getByText("Archived Course")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Inactive")).toBeTruthy();
    expect(screen.getByText("ID: 1")).toBeTruthy();
    expect(screen.getByText("ID: 2")).toBeTruthy();
  });

  it("calls row action handlers", () => {
    const setStudentsTarget = vi.fn();
    const setDeleteTarget = vi.fn();
    const onOpenEditModal = vi.fn();

    render(
      <CourseManagementTable
        courses={[courses[0]] as never}
        courseManagementState={{
          setStudentsTarget,
          setDeleteTarget,
        } as never}
        onOpenEditModal={onOpenEditModal}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View students" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(setStudentsTarget).toHaveBeenCalledWith(courses[0]);
    expect(onOpenEditModal).toHaveBeenCalledWith(courses[0]);
    expect(setDeleteTarget).toHaveBeenCalledWith(courses[0]);
  });

  it("renders a dash when description is empty", () => {
    render(
      <CourseManagementTable
        courses={[courses[1]] as never}
        courseManagementState={{
          setStudentsTarget: vi.fn(),
          setDeleteTarget: vi.fn(),
        } as never}
        onOpenEditModal={vi.fn()}
      />
    );

    expect(screen.getByText("—")).toBeTruthy();
  });
});