import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CourseManagement from "@/pages/Course/CourseManagement";
import * as courseService from "@/services/courseService";

const mockRefresh = vi.fn();
const mockSetSearch = vi.fn();
const mockCreateCourse = vi.fn();
const mockUpdateCourse = vi.fn();
const mockDeleteCourse = vi.fn();

const mockGetCourseStudents = vi.spyOn(courseService, "getCourseStudents");

let mockUseCoursesReturn: {
  state: { search: string };
  managedFilteredCourses: {
    id: number;
    name: string;
    description: string;
    active: boolean;
    created_at: string;
  }[];
  loading: boolean;
  error: string | null;
  actions: {
    refresh: typeof mockRefresh;
    setSearch: typeof mockSetSearch;
    createCourse: typeof mockCreateCourse;
    updateCourse: typeof mockUpdateCourse;
    deleteCourse: typeof mockDeleteCourse;
  };
};

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>
          {confirmText}
        </button>
        <button type="button" onClick={onClose}>
          {cancelText}
        </button>
      </div>
    ) : null,
}));

vi.mock("@/hooks/course/useCourse", () => ({
  useCourses: () => mockUseCoursesReturn,
}));

vi.mock("@/services/courseService", async () => {
  const actual = await vi.importActual<typeof courseService>("@/services/courseService");
  return {
    ...actual,
    getCourseStudents: vi.fn(),
  };
});

describe("CourseManagement", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockSetSearch.mockReset();
    mockCreateCourse.mockReset();
    mockUpdateCourse.mockReset();
    mockDeleteCourse.mockReset();
    mockGetCourseStudents.mockReset();

    mockUseCoursesReturn = {
      state: { search: "" },
      managedFilteredCourses: [
        {
          id: 1,
          name: "Python Basics",
          description: "Intro course",
          active: true,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      loading: false,
      error: null,
      actions: {
        refresh: mockRefresh,
        setSearch: mockSetSearch,
        createCourse: mockCreateCourse,
        updateCourse: mockUpdateCourse,
        deleteCourse: mockDeleteCourse,
      },
    };
  });

  it("renders the course list and header controls", () => {
    render(<CourseManagement />);

    expect(screen.getByText("Course Management")).toBeTruthy();
    expect(screen.getByDisplayValue("")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ New Course" })).toBeTruthy();
    expect(screen.getByText("Python Basics")).toBeTruthy();
    expect(screen.getByText("1 course")).toBeTruthy();
  });

  it("updates search and refreshes courses", () => {
    render(<CourseManagement />);

    fireEvent.change(screen.getByPlaceholderText("Search courses..."), {
      target: { value: "math" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(mockSetSearch).toHaveBeenCalledWith("math");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("opens the create modal and validates empty course name", async () => {
    render(<CourseManagement />);

    fireEvent.click(screen.getByRole("button", { name: "+ New Course" }));
    expect(screen.getByText("Create New Course")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Create Course" }));

    expect(await screen.findByText("Course name is required.")).toBeTruthy();
    expect(mockCreateCourse).not.toHaveBeenCalled();
  });

  it("creates a course successfully", async () => {
    mockCreateCourse.mockResolvedValueOnce({ id: 2 });

    render(<CourseManagement />);

    fireEvent.click(screen.getByRole("button", { name: "+ New Course" }));
    fireEvent.change(screen.getByLabelText("Course Name *"), {
      target: { value: "New Course" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Course description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Course" }));

    await waitFor(() => {
      expect(mockCreateCourse).toHaveBeenCalledWith({
        name: "New Course",
        description: "Course description",
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Create New Course")).toBeNull();
    });
  });

  it("opens the edit modal and saves updates", async () => {
    mockUpdateCourse.mockResolvedValueOnce({ id: 1 });

    render(<CourseManagement />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Edit Course")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Course Name *"), {
      target: { value: "Updated Name" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Updated Description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateCourse).toHaveBeenCalledWith(1, {
        name: "Updated Name",
        description: "Updated Description",
      });
    });
  });



  it("opens students modal and loads students", async () => {
    mockGetCourseStudents.mockResolvedValueOnce([
      { id: 10, username: "student1" },
      { id: 11, username: "student2" },
    ]);

    render(<CourseManagement />);

    fireEvent.click(screen.getByRole("button", { name: "View students" }));

    expect(await screen.findByText("Students in Python Basics")).toBeTruthy();
    expect(await screen.findByText("student1")).toBeTruthy();
    expect(await screen.findByText("student2")).toBeTruthy();
  });

  it("shows the empty state when there are no courses", () => {
    mockUseCoursesReturn.managedFilteredCourses = [];

    render(<CourseManagement />);

    expect(screen.getByText("No courses yet")).toBeTruthy();
  });

  it("renders loading and error states", () => {
    mockUseCoursesReturn.loading = true;
    mockUseCoursesReturn.error = "Something went wrong";
    mockUseCoursesReturn.managedFilteredCourses = [];

    render(<CourseManagement />);

    expect(screen.getByText("Loading courses...")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});