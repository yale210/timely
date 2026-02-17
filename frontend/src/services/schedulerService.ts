import api from "./api";
import { type ScheduleResponse } from "../types";

export interface ScheduleRequest {
  start_date?: string;
  max_days_ahead?: number;
  allow_split?: boolean;
  min_block_minutes?: number;
}

export const scheduleTasks = async (payload: ScheduleRequest): Promise<ScheduleResponse> => {
  const response = await api.post<ScheduleResponse>("/api/schedule/", payload);
  return response.data;
};

export const unscheduleTasks = async (): Promise<{ unscheduled_count: number }> => {
  const response = await api.post<{ unscheduled_count: number }>("/api/unschedule/");
  return response.data;
};
