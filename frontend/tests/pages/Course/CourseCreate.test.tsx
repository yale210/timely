import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CourseCreate from "@/pages/Course/CourseCreate";
import * as courseService from "@/services/courseService";

const mockNavigate = vi.fn();
const mockCreateCourse = vi.spyOn(courseService, "createCourse");

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/course/useTeacher", () => ({
  useTeacher: () => ({ loading: false, error: null }),
}));

describe("CourseCreate", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCreateCourse.mockReset();
  });

  it("renders the create course form", () => {
    render(<CourseCreate />);

    expect(screen.getByText("Create Course")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. Introduction to Python")).toBeTruthy();
    expect(screen.getByPlaceholderText("Write a short course description...")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create course" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("navigates back when cancel is clicked", () => {
    render(<CourseCreate />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockNavigate).toHaveBeenCalledWith("/courses");
  });

});
