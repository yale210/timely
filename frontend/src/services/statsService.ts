import api from "./api";
import type { WeeklyStats } from "@/types";

/**
 * Retrieves the weekly task summary for a given week.
 * @param date - Optional date (YYYY-MM-DD) within the desired week.
 * @returns A promise resolving to the weekly statistics.
 */
export const getWeeklySummary = async (date?: string): Promise<WeeklyStats> => {
  const params = date ? { date } : {};
  const response = await api.get<WeeklyStats>("/api/stats/weekly/", { params });
  return response.data;
};

export default { getWeeklySummary };
