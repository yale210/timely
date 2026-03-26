import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CoursesEmptyState from "@/components/course/CourseEmptyState";

describe("CoursesEmptyState", () => {
  it("renders the empty state message", () => {
    render(<CoursesEmptyState />);

    expect(screen.getByText("No courses found.")).toBeTruthy();
  });
});