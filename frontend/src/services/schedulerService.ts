import api from "@/services/api";
import { type ScheduleResponse } from "@/types";

/**
 * Represents the request payload for scheduling tasks.
 */
export interface ScheduleRequest {
  start_date?: string;
  max_days_ahead?: number;
  allow_split?: boolean;
  replace_existing?: boolean;
  min_block_minutes?: number;
}

/**
 * Schedules tasks based on the provided request parameters.
 * @param payload - The scheduling parameters.
 * @returns A promise that resolves to the scheduling response.
 */
export const scheduleTasks = async (payload: ScheduleRequest): Promise<ScheduleResponse> => {
  const response = await api.post<ScheduleResponse>("/api/schedule/", payload);
  return response.data;
};

/**
 * Unschedules all currently scheduled tasks.
 * @returns A promise that resolves to the count of unscheduled tasks.
 */
export const unscheduleTasks = async (): Promise<{ unscheduled_count: number }> => {
  const response = await api.post<{ unscheduled_count: number }>("/api/unschedule/");
  return response.data;
};
