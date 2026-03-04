import api from "./api";

import { type Task, type Category, type TaskSubmission } from "@/types";

/**
 * Retrieves a list of tasks from the server, optionally filtered by the provided criteria.
 * @param filters - An optional object containing filtration criteria.
 * @returns A promise that resolves to an array of task objects.
 */
export const getTasks = async (filters?: Record<string, string | number | null>): Promise<Task[]> => {
  const response = await api.get<Task[]>("/api/tasks/", { params: filters });
  return response.data;
};

/**
 * Creates a new task on the server with the specified details.
 * @param data - The data required to initialise a new task.
 * @returns A promise that resolves to the newly created task object.
 */
export const createTask = async (data: TaskSubmission): Promise<Task> => {
  const response = await api.post<Task>("/api/tasks/", data);
  return response.data;
};

/**
 * Updates an existing task on the server with the provided information.
 * @param id - The unique identifier of the task to be updated.
 * @param data - The updated information for the task.
 * @returns A promise that resolves to the modified task object.
 */
export const updateTask = async (id: number, data: TaskSubmission): Promise<Task> => {
  const response = await api.patch<Task>(`/api/tasks/${id}/`, data);
  return response.data;
};

/**
 * Removes a task from the server.
 * @param id - The unique identifier of the task to be deleted.
 * @returns A promise that resolves once the task has been successfully removed.
 */
export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/api/tasks/${id}/`);
};

/**
 * Retrieves a list of task categories from the server.
 * @returns A promise that resolves to an array of category objects.
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>("/api/categories/");
  return response.data;
};
