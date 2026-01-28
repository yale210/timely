import axios from "axios";

import { type Task, type Category, type TaskSubmission } from "../types";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

export const getTasks = async (filters?: Record<string, string | number | null>): Promise<Task[]> => {
  const response = await axios.get("/api/tasks/", { params: filters });
  return response.data;
};

export const createTask = async (data: TaskSubmission): Promise<Task> => {
  const response = await axios.post("/api/tasks/", data);
  return response.data;
};

export const updateTask = async (id: number, data: TaskSubmission): Promise<Task> => {
  const response = await axios.patch(`/api/tasks/${id}/`, data);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await axios.delete(`/api/tasks/${id}/`);
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get("/api/categories/");
  return response.data;
};
