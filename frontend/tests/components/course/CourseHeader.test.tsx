import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CoursesHeader from "@/components/course/CourseHeader";

describe("CoursesHeader", () => {
  const onSearchChange = vi.fn();
  const onJoinCourseIdChange = vi.fn();
  const onJoinCourse = vi.fn();
  const onRefresh = vi.fn();
  const onCreateCourse = vi.fn();
  const onManageCourses = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the basic header controls", () => {
    render(
      <CoursesHeader
        search=""
        joinCourseId=""
        onSearchChange={onSearchChange}
        onJoinCourseIdChange={onJoinCourseIdChange}
        onJoinCourse={onJoinCourse}
        onRefresh={onRefresh}
        isTeacher={false}
        onManageCourses={onManageCourses}
      />
    );

    expect(screen.getByRole("heading", { name: "Courses" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Search courses")).toBeTruthy();
    expect(screen.getByPlaceholderText("Course ID")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Join" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create course" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage" })).toBeNull();
  });

  it("calls input and action handlers", () => {
    render(
      <CoursesHeader
        search="py"
        joinCourseId="42"
        onSearchChange={onSearchChange}
        onJoinCourseIdChange={onJoinCourseIdChange}
        onJoinCourse={onJoinCourse}
        onRefresh={onRefresh}
        isTeacher={true}
        onManageCourses={onManageCourses}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search courses"), {
      target: { value: "python" },
    });
    fireEvent.change(screen.getByPlaceholderText("Course ID"), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));

    expect(onSearchChange).toHaveBeenCalledWith("python");
    expect(onJoinCourseIdChange).toHaveBeenCalledWith("123");
    expect(onJoinCourse).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onCreateCourse).toHaveBeenCalledTimes(1);
    expect(onManageCourses).toHaveBeenCalledTimes(1);
  });

  it("enables join when a course id is present", () => {
    render(
      <CoursesHeader
        search=""
        joinCourseId="abc"
        onSearchChange={onSearchChange}
        onJoinCourseIdChange={onJoinCourseIdChange}
        onJoinCourse={onJoinCourse}
        onRefresh={onRefresh}
        isTeacher={false}
        onManageCourses={onManageCourses}
      />
    );

    expect(screen.getByRole("button", { name: "Join" })).toBeEnabled();
  });
});