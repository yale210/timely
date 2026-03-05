import api from "./api";
import type { Category } from "@/types";

/**
 * Retrieves a list of categories for the current user.
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>("/api/categories/");
  return response.data;
};

/**
 * Creates a new category for the current user.
 */
export const createCategory = async (text: string): Promise<Category> => {
  const response = await api.post<Category>("/api/categories/", { text });
  return response.data;
};

/**
 * Updates an existing category.
 */
export const updateCategory = async (
  id: number,
  patch: Partial<Pick<Category, "text" | "colour">>,
): Promise<Category> => {
  const response = await api.patch<Category>(`/api/categories/${id}/`, patch);
  return response.data;
};

/**
 * Deletes a category.
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/api/categories/${id}/`);
};
