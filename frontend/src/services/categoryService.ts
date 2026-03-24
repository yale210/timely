import api from "@/services/api";
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
 * @param text - The display name for the category.
 */
export const createCategory = async (text: string): Promise<Category> => {
  const response = await api.post<Category>("/api/categories/", { text });
  return response.data;
};

/**
 * Updates an existing category.
 * @param id - The category identifier.
 * @param patch - The fields to update for the category.
 */
export const updateCategory = async (
  id: number,
  patch: Partial<Pick<Category, "text" | "colour" | "colour_override" | "max_daily_study_time">>,
): Promise<Category> => {
  const response = await api.patch<Category>(`/api/categories/${id}/`, patch);
  return response.data;
};

/**
 * Deletes a category.
 * @param id - The category identifier.
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/api/categories/${id}/`);
};
