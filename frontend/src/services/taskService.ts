import axios from "axios";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

export const getTasks = async (filters?: any) => {
  const response = await axios.get("/api/tasks/", { params: filters });
  return response.data;
};

export const createTask = async (data: any) => {
  const response = await axios.post("/api/tasks/", data);
  return response.data;
};

export const updateTask = async (id: number, data: any) => {
  const response = await axios.patch(`/api/tasks/${id}/`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await axios.delete(`/api/tasks/${id}/`);
  return response.data;
};

export const getCategories = async () => {
  const response = await axios.get("/api/categories/");
  return response.data;
};
