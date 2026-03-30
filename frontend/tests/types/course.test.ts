import { describe, expectTypeOf, it } from "vitest";
import type {
  CachedPermissionsEntry,
  Course,
  CourseCreation,
  CourseDetailConsts,
  CourseDetailHooks,
  CourseDetailState,
  CourseEditForm,
  CourseEvent,
  CourseEventCreation,
  CourseEventForm,
  CourseJoinCode,
  CourseJoinCodeForm,
  CourseManagmentState,
  CoursePermissions,
  CourseStaff,
  CourseStudent,
  CourseUpdate,
  UseCoursesActions,
  UseCoursesReturn,
  UseCoursesState,
} from "@/types/course";
import { useCourseDetailStates } from "@/hooks/course/useCourseDetail";
import { useCourseDetailConsts } from "@/hooks/course/useCourseDetailConsts";
import { useCourseDetailHooks } from "@/hooks/course/useCourseDetailHooks";
import { useCourseManagementState } from "@/hooks/course/useCourseManagementState";

describe("course types", () => {
  it("keeps the exported hook-derived aliases aligned", () => {
    expectTypeOf<CourseDetailState>().toEqualTypeOf<ReturnType<typeof useCourseDetailStates>>();
    expectTypeOf<CourseDetailConsts>().toEqualTypeOf<ReturnType<typeof useCourseDetailConsts>>();
    expectTypeOf<CourseDetailHooks>().toEqualTypeOf<ReturnType<typeof useCourseDetailHooks>>();
    expectTypeOf<CourseManagmentState>().toEqualTypeOf<ReturnType<typeof useCourseManagementState>>();
  });

  it("defines the main course entity shapes", () => {
    const student = { id: 1, username: "student1" } satisfies CourseStudent;
    const staff = {
      id: 2,
      user_id: 22,
      username: "teacher1",
      active: true,
      assigned_at: "2026-03-30T09:00:00Z",
    } satisfies CourseStaff;
    const course = {
      id: 10,
      name: "Software Engineering",
      description: "Core module",
      lead: "teacher1",
      created_at: "2026-03-01T12:00:00Z",
      active: true,
      students: [student],
    } satisfies Course;

    expectTypeOf(student).toMatchTypeOf<CourseStudent>();
    expectTypeOf(staff).toMatchTypeOf<CourseStaff>();
    expectTypeOf(course).toMatchTypeOf<Course>();
  });

  it("defines course payload and permission shapes", () => {
    const creation = {
      name: "Software Engineering",
      description: "Core module",
      lead: 22,
      active: true,
    } satisfies CourseCreation;

    const update = {
      id: 10,
      description: "Updated description",
    } satisfies CourseUpdate;

    const permissions = {
      can_view_course_details: true,
      can_view_events: true,
      can_create_join_code: true,
      can_change_name: true,
      can_change_description: true,
      can_update_course: true,
      can_destroy_course: false,
      can_manage_staff: true,
      can_join: false,
      can_leave: true,
    } satisfies CoursePermissions;

    const cached = {
      value: permissions,
      expiresAt: Date.now() + 60000,
    } satisfies CachedPermissionsEntry;

    expectTypeOf(creation).toMatchTypeOf<CourseCreation>();
    expectTypeOf(update).toMatchTypeOf<CourseUpdate>();
    expectTypeOf(permissions).toMatchTypeOf<CoursePermissions>();
    expectTypeOf(cached).toMatchTypeOf<CachedPermissionsEntry>();
  });

  it("defines course event and form shapes", () => {
    const joinCode = {
      id: 1,
      code: "ABC123",
      expires_at: null,
      active: true,
      created_at: "2026-03-30T09:00:00Z",
    } satisfies CourseJoinCode;

    const event = {
      id: 2,
      course: 10,
      created_by: 22,
      created_at: "2026-03-30T09:00:00Z",
      updated_at: "2026-03-30T10:00:00Z",
    } satisfies CourseEvent;

    const eventCreation = {
      course: 10,
      created_by: 22,
    } satisfies CourseEventCreation;

    const editForm = {
      name: "Software Engineering",
      description: "Core module",
      active: true,
    } satisfies CourseEditForm;

    const eventForm = {
      title: "Lecture",
      description: "Week 1",
      location: "Room 101",
      start_time: "2026-03-30T09:00:00Z",
      end_time: "2026-03-30T10:00:00Z",
    } satisfies CourseEventForm;

    const joinCodeForm = {
      expires_at: "2026-04-01T00:00:00Z",
    } satisfies CourseJoinCodeForm;

    expectTypeOf(joinCode).toMatchTypeOf<CourseJoinCode>();
    expectTypeOf(event).toMatchTypeOf<CourseEvent>();
    expectTypeOf(eventCreation).toMatchTypeOf<CourseEventCreation>();
    expectTypeOf(editForm).toMatchTypeOf<CourseEditForm>();
    expectTypeOf(eventForm).toMatchTypeOf<CourseEventForm>();
    expectTypeOf(joinCodeForm).toMatchTypeOf<CourseJoinCodeForm>();
  });

  it("defines the useCourses state and action contracts", () => {
    const state = {
      courses: [],
      selectedCourse: null,
      search: "",
      staff: null,
    } satisfies UseCoursesState;

    const actions = {
      setSearch: (_value: string) => undefined,
      selectCourse: (_course: Course | null) => undefined,
      refresh: async () => undefined,
      createCourse: async (_data: CourseCreation) => null,
      updateCourse: async (_id: number, _data: CourseUpdate) => null,
      deleteCourse: async (_id: number) => undefined,
      joinCourse: async (_id: string) => null,
      leaveCourse: async (_id: number) => null,
      getStaff: async (_courseId: number) => [],
    } satisfies UseCoursesActions;

    const result = {
      state,
      filteredCourses: [],
      loading: false,
      error: null,
      actions,
      managedFilteredCourses: [],
    } satisfies UseCoursesReturn;

    expectTypeOf(state).toMatchTypeOf<UseCoursesState>();
    expectTypeOf(actions).toMatchTypeOf<UseCoursesActions>();
    expectTypeOf(result).toMatchTypeOf<UseCoursesReturn>();
  });
});
