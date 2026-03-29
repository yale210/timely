import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGet,
  mockPost,
  mockPut,
  mockDelete,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: mockGetUser,
  },
}));

import * as courseService from "@/services/courseService";

describe("courseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    courseService.clearCoursePermissionsCache();
    vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    mockGetUser.mockReturnValue({ id: 7 } as never);
  });

  it("getCourses calls the courses list endpoint with params", async () => {
    const courses = [{ id: 1, name: "Math" }];
    mockGet.mockResolvedValue({ data: courses });

    const result = await courseService.getCourses({ name: "Math", lead: "7" });

    expect(mockGet).toHaveBeenCalledWith("/api/courses/", { params: { name: "Math", lead: "7" } });
    expect(result).toEqual(courses);
  });

  it("getCourse calls the detail endpoint", async () => {
    const course = { id: 2, name: "Science" };
    mockGet.mockResolvedValue({ data: course });

    await expect(courseService.getCourse(2)).resolves.toEqual(course);
    expect(mockGet).toHaveBeenCalledWith("/api/courses/2/");
  });

  it("createCourse posts the payload", async () => {
    const payload = { name: "History" };
    const created = { id: 3, name: "History" };
    mockPost.mockResolvedValue({ data: created });

    const result = await courseService.createCourse(payload as never);

    expect(mockPost).toHaveBeenCalledWith("/api/courses/", payload);
    expect(result).toEqual(created);
  });

  it("getCoursePermissions caches results for the same user and course", async () => {
    const permissions = { can_edit: true };
    mockGet.mockResolvedValue({ data: permissions });

    const first = await courseService.getCoursePermissions(10);
    const second = await courseService.getCoursePermissions(10);

    expect(first).toEqual(permissions);
    expect(second).toEqual(permissions);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/api/courses/10/permissions/");
  });

  it("getCoursePermissions refreshes when forceRefresh is true", async () => {
    mockGet.mockResolvedValueOnce({ data: { can_edit: true } });
    mockGet.mockResolvedValueOnce({ data: { can_edit: false } });

    const first = await courseService.getCoursePermissions(11);
    const second = await courseService.getCoursePermissions(11, { forceRefresh: true });

    expect(first).toEqual({ can_edit: true });
    expect(second).toEqual({ can_edit: false });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("updateCourse clears cached permissions for the current user", async () => {
    mockPut.mockResolvedValue({ data: { id: 12, name: "Updated" } });


    await courseService.updateCourse(12, { name: "Updated" } as never);

    expect(mockPut).toHaveBeenCalledWith("/api/courses/12/", { name: "Updated" });
  });

  it("deleteCourse clears cached permissions for the current user", async () => {
    mockDelete.mockResolvedValue({});

    await courseService.deleteCourse(13);

    expect(mockDelete).toHaveBeenCalledWith("/api/courses/13/");
  });

  it("joinCourse posts the code and clears permissions for the joined course", async () => {
    mockPost.mockResolvedValue({ data: { id: 14, name: "Joined course" } });

    const result = await courseService.joinCourse("ABC123");

    expect(mockPost).toHaveBeenCalledWith("/api/courses/join-by-code/", { code: "ABC123" });
    expect(result).toEqual({ id: 14, name: "Joined course" });
  });

  it("leaveCourse posts to the leave endpoint", async () => {
    mockPost.mockResolvedValue({ data: { id: 15, name: "Left course" } });

    const result = await courseService.leaveCourse(15);

    expect(mockPost).toHaveBeenCalledWith("/api/courses/15/leave/");
    expect(result).toEqual({ id: 15, name: "Left course" });
  });

  it("createCourseEvent posts event data", async () => {
    const event = { id: 1, title: "Exam" };
    mockPost.mockResolvedValue({ data: event });

    const result = await courseService.createCourseEvent(16, { title: "Exam" });

    expect(mockPost).toHaveBeenCalledWith("/api/courses/16/events/", { title: "Exam" });
    expect(result).toEqual(event);
  });

  it("getCourseStudents returns course students", async () => {
    mockGet.mockResolvedValue({ data: { id: 17, students: [{ id: 1, name: "Ada" }] } });

    const result = await courseService.getCourseStudents(17);

    expect(mockGet).toHaveBeenCalledWith("/api/courses/17/");
    expect(result).toEqual([{ id: 1, name: "Ada" }]);
  });

  it("getStaff calls the staff endpoint", async () => {
    const staff = [{ id: 1, name: "Prof" }];
    mockGet.mockResolvedValue({ data: staff });

    const result = await courseService.getStaff(18);

    expect(mockGet).toHaveBeenCalledWith("/api/courses/18/staff/");
    expect(result).toEqual(staff);
  });

  it("getCurrentTeacher calls the teacher endpoint", async () => {
    const teacher = { id: 1, name: "Teacher" };
    mockGet.mockResolvedValue({ data: teacher });

    const result = await courseService.getCurrentTeacher();

    expect(mockGet).toHaveBeenCalledWith("/api/teachers/me/");
    expect(result).toEqual(teacher);
  });

  it("createJoinCode posts data and returns the code payload", async () => {
    mockPost.mockResolvedValue({ data: { code: "ZXCV12" } });

    const result = await courseService.createJoinCode(19, { expires_at: null });

    expect(mockPost).toHaveBeenCalledWith("/api/courses/19/join-code/", { expires_at: null });
    expect(result).toEqual({ code: "ZXCV12" });
  });

  it("makeMyTeacherProfile posts the current user id", async () => {
    mockPost.mockResolvedValue({});

    await courseService.makeMyTeacherProfile();

    expect(mockPost).toHaveBeenCalledWith("/api/teachers/create_teacher/", { user_id: 7 });
  });

  it("unregisterMyTeacherProfile posts to the unregister endpoint", async () => {
    mockPost.mockResolvedValue({});

    await courseService.unregisterMyTeacherProfile();

    expect(mockPost).toHaveBeenCalledWith("/api/teachers/unregister_teacher/");
  });
});