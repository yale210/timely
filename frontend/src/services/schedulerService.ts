import axios from "axios";

import { type ScheduleResponse } from "../types";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

export interface ScheduleRequest {
  start_date?: string;
  max_days_ahead?: number;
  allow_split?: boolean;
  min_block_minutes?: number;
}

export const scheduleTasks = async (payload: ScheduleRequest): Promise<ScheduleResponse> => {
  const response = await axios.post<ScheduleResponse>("/api/schedule/", payload);
  return response.data;
};

export const unscheduleTasks = async (): Promise<{ unscheduled_count: number }> => {
  const response = await axios.post<{ unscheduled_count: number }>("/api/unschedule/");
  return response.data;
};
