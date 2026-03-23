import type { Category } from "@/types";

/**
 * Supported visual variants for the category multi-select.
 */
export type CategoryVariant = "task" | "event";

/**
 * Shared screen coordinates for floating category UI elements.
 */
export interface FloatingPosition {
  top: number;
  left: number;
}

/**
 * Screen coordinates and width for the category dropdown.
 */
export interface DropdownPosition extends FloatingPosition {
  width: number;
}

/**
 * Supported partial updates for a category record.
 */
export interface CategoryUpdatePatch {
  colour?: string | null;
  colour_override?: boolean;
}

/**
 * Variant-specific class names used by the multi-select UI.
 */
export interface CategoryVariantStyles {
  inputFocus: string;
  optionBase: string;
  addBase: string;
}

/**
 * Props for the category multi-select component.
 */
export interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (
    id: number,
    patch: CategoryUpdatePatch,
  ) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  variant: CategoryVariant;
}
