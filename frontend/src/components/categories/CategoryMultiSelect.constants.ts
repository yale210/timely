import type {
  CategoryVariant,
  CategoryVariantStyles,
} from "./CategoryMultiSelect.types";

export const MAX_CATEGORY_LENGTH = 20;
export const DEFAULT_SWATCH = "#94a3b8";

export const PRESET_COLOURS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#20c7a3",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#92400e",
  "#64748b",
];

export const VARIANT_STYLES: Record<CategoryVariant, CategoryVariantStyles> = {
  task: {
    inputFocus: "focus:ring-primary focus:border-primary",
    optionBase: "text-gray-700 hover:bg-gray-50",
    addBase: "text-primary hover:bg-blue-50",
  },
  event: {
    inputFocus: "focus:ring-orange-500 focus:border-orange-500",
    optionBase: "text-gray-700 hover:bg-gray-50",
    addBase: "text-orange-600 hover:bg-orange-50",
  },
};
