import api from "./api";
import { type ScheduleResponse } from "../types";

/**
 * Payload for scheduling tasks.
 */
export interface ScheduleRequest {
  start_date?: string;
  max_days_ahead?: number;
  allow_split?: boolean;
  min_block_minutes?: number;
}

/**
 * Request automatic scheduling for tasks.
 * @param payload - Scheduling options.
 */
export const scheduleTasks = async (
  payload: ScheduleRequest
): Promise<ScheduleResponse> => {
  const response = await api.post<ScheduleResponse>("/api/schedule/", payload);
  return response.data;
};

/**
 * Clear all scheduled allocations for tasks.
 */
export const unscheduleTasks = async (): Promise<{ unscheduled_count: number }> => {
  const response = await api.post<{ unscheduled_count: number }>("/api/unschedule/");
  return response.data;
};
