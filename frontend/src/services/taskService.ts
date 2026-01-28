import axios from "axios";

import { type Task, type Category, type TaskSubmission } from "../types";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

/**
 * Retrieves a list of tasks from the server, optionally filtered by the provided criteria.
 * @param filters - An optional object containing filtration criteria.
 * @returns A promise that resolves to an array of task objects.
 */
export const getTasks = async (filters?: Record<string, string | number | null>): Promise<Task[]> => {
  const response = await axios.get("/api/tasks/", { params: filters });
  return response.data;
};

/**
 * Creates a new task on the server with the specified details.
 * @param data - The data required to initialise a new task.
 * @returns A promise that resolves to the newly created task object.
 */
export const createTask = async (data: TaskSubmission): Promise<Task> => {
  const response = await axios.post("/api/tasks/", data);
  return response.data;
};

/**
 * Updates an existing task on the server with the provided information.
 * @param id - The unique identifier of the task to be updated.
 * @param data - The updated information for the task.
 * @returns A promise that resolves to the modified task object.
 */
export const updateTask = async (id: number, data: TaskSubmission): Promise<Task> => {
  const response = await axios.patch(`/api/tasks/${id}/`, data);
  return response.data;
};

/**
 * Removes a task from the server.
 * @param id - The unique identifier of the task to be deleted.
 * @returns A promise that resolves once the task has been successfully removed.
 */
export const deleteTask = async (id: number): Promise<void> => {
  await axios.delete(`/api/tasks/${id}/`);
};

/**
 * Retrieves a list of task categories from the server.
 * @returns A promise that resolves to an array of category objects.
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get("/api/categories/");
  return response.data;
};
