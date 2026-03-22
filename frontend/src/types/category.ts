/**
 * Represents a category that can be assigned to a task.
 * @interface Category
 * @property id - The unique identifier for the category.
 * @property text - The display name of the category.
 */
export interface Category {
  id: number;
  text: string;
  colour?: string | null;
  colour_override?: boolean;
}