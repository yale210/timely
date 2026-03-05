import type { Category } from "@/types";

/**
 * Converts a hex colour to rgba with the provided alpha.
 * @param hex - The hex colour string (e.g. #ffffff).
 * @param alpha - The alpha channel between 0 and 1.
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Returns the first category colour override if present.
 * @param categories - The categories to scan.
 */
export const getOverrideColour = (categories: Category[] | undefined): string | null => {
  if (!categories || categories.length === 0) return null;
  const match = categories.find((category) => category.colour_override && category.colour);
  return match?.colour ?? null;
};
