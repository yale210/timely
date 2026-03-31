import { describe, expectTypeOf, it } from "vitest";
import type { Teacher, TeacherCourse, TeacherInfo } from "@/types/teacher";

describe("teacher types", () => {
  it("defines a teacher course shape", () => {
    const course = {
      id: 1,
      name: "Algorithms",
      description: "Core module",
      created_at: "2026-03-01T12:00:00Z",
      active: true,
    } satisfies TeacherCourse;

    expectTypeOf(course).toMatchTypeOf<TeacherCourse>();
  });

  it("defines the teacher payload shape", () => {
    const teacher = {
      id: 1,
      user_id: 12,
      username: "lecturer",
      active: true,
      courses: [{
        id: 1,
        name: "Algorithms",
        description: "Core module",
        created_at: "2026-03-01T12:00:00Z",
        active: true,
      }],
    } satisfies Teacher;

    expectTypeOf(teacher).toMatchTypeOf<Teacher>();
  });

  it("defines the teacher info payload shape", () => {
    const teacherInfo = {
      id: 1,
      user_id: 12,
      username: "lecturer",
      active: true,
      courses: [{
        id: 1,
        name: "Algorithms",
        description: "Core module",
        created_at: "2026-03-01T12:00:00Z",
        active: true,
      }],
    } satisfies TeacherInfo;

    expectTypeOf(teacherInfo).toMatchTypeOf<TeacherInfo>();
  });
});
