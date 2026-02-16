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
