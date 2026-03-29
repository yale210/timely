import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CourseManagementHeader from "@/components/course/CourseManagementHeader";

describe("CourseManagementHeader", () => {
  it("renders the header content", () => {
    render(
      <CourseManagementHeader
        state={{ search: "" } as never}
        actions={{ setSearch: vi.fn() } as never}
        refreshCourses={vi.fn()}
        openCreateModal={vi.fn()}
      />
    );

    expect(screen.getByText("Teacher Tools")).toBeTruthy();
    expect(screen.getByText("Course Management")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ New Course" })).toBeTruthy();
  });

  it("updates search text and fires top-level actions", () => {
    const setSearch = vi.fn();
    const refreshCourses = vi.fn();
    const openCreateModal = vi.fn();

    render(
      <CourseManagementHeader
        state={{ search: "" } as never}
        actions={{ setSearch } as never}
        refreshCourses={refreshCourses}
        openCreateModal={openCreateModal}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search courses..."), {
      target: { value: "biology" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "+ New Course" }));

    expect(setSearch).toHaveBeenCalledWith("biology");
    expect(refreshCourses).toHaveBeenCalledTimes(1);
    expect(openCreateModal).toHaveBeenCalledTimes(1);
  });
});