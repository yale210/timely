import api from "./api";
import type { WeeklyStats } from "../types";

/**
 * Retrieves the weekly task summary for the current user.
 * @returns A promise resolving to the weekly statistics.
 */
export const getWeeklySummary = async (): Promise<WeeklyStats> => {
  const response = await api.get<WeeklyStats>("/api/stats/weekly/");
  return response.data;
};

export default { getWeeklySummary };
