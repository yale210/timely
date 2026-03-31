import { formatDateTimeInTimezone } from "@/utils/userTimezone";

export const overviewIconClassName = "bg-cyan-100 text-cyan-700";

export const MAX_UPCOMING_TASKS = 4;
export const UPCOMING_TASK_ROW_HEIGHT = 52;
export const UPCOMING_TASK_ROW_GAP = 12;

/**
 * Maps an importance score to a user-facing label.
 * @param importance - Task importance value.
 * @returns The display label for the score.
 */
export const getImportanceLabel = (importance: number) => {
  if (importance >= 9) return "Critical";
  if (importance >= 7) return "High";
  if (importance >= 5) return "Medium";
  if (importance >= 3) return "Low";
  return "Very low";
};

/**
 * Formats a deadline for the upcoming-tasks list.
 * @param isoString - ISO timestamp to format.
 * @returns A short localized due-date string.
 */
export const formatDueDate = (isoString: string) => formatDateTimeInTimezone(isoString, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Calculates the XP required to reach the next level.
 * @param level - Current player level.
 * @returns Required XP for the next level.
 */
export const getRequiredExp = (level: number) => {
  const nextLevel = Math.max(1, level + 1);
  return Math.round(100 * nextLevel ** 1.5);
};
