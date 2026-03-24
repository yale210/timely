import api from "@/services/api";
import type {Course, CourseCreation, CourseStaff, CourseStudent, CourseUpdate} from "@/types/course";
import type { Event } from "@/types/event";
import type {Teacher} from "@/types/teacher.ts";

export const getCourses = async (
  params?: { name?: string; lead?: string },
): Promise<Course[]> => {
  const response = await api.get<Course[]>("/api/courses/", { params });
  return response.data;
};

export const getCourse = async (id: number): Promise<Course> => {
  const response = await api.get<Course>(`/api/courses/${id}/`);
  return response.data;
};

export const createCourse = async (data: CourseCreation): Promise<Course> => {
  const response = await api.post<Course>("/api/courses/", data);
  return response.data;
};

export const updateCourse = async (id: number, data: CourseUpdate): Promise<Course> => {
  const response = await api.put<Course>(`/api/courses/${id}/`, data);
  return response.data;
};

export const deleteCourse = async (id: number): Promise<void> => {
  await api.delete(`/api/courses/${id}/`);
};

export const joinCourse = async (id: number): Promise<Course> => {
  const response = await api.post<Course>(`/api/courses/${id}/join/`);
  return response.data;
};

export const leaveCourse = async (id: number): Promise<Course> => {
  const response = await api.post<Course>(`/api/courses/${id}/leave/`);
  return response.data;
};

export const getCourseEvents = async (id: number): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/api/courses/${id}/events/`);
  return response.data;
};

export const createCourseEvent = async (id: number, data: unknown) => {
  const response = await api.post(`/api/courses/${id}/events/`, data);
  return response.data;
};

export const getCourseStudents = async (id: number): Promise<CourseStudent[]> => {
  const response = await api.get<CourseStudent[]>(`/api/courses/${id}/students/`);
  return response.data;
};

export const getStaff = async (id: number): Promise<CourseStaff[]> => {
  const response = await api.get<CourseStaff[]>(`/api/courses/${id}/staff/`);
  return response.data;
};

export const getCurrentTeacher = async (): Promise<Teacher> => {
  const response = await api.get<Teacher>("/api/teachers/");
  console.log(response.data);
  return response.data;
};

export const createJoinCode = async (id: number, data: { expires_at?: string }): Promise<string> => {
  const response = await api.post<string>(`/api/courses/${id}/join-code/`, data);
  return response.data;
};