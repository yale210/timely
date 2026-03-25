/**
 * Represents a single result of a task scheduling operation.
 */
export interface ScheduleResult {
  task_id: number;
  success: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  reason?: string | null;
}

/**
 * Represents the response from the task scheduling API.
 */
export interface ScheduleResponse {
  start_date: string;
  scheduled_count: number;
  failed_count: number;
  results: ScheduleResult[];
}

/**
 * Represents the response from the event export API.
 */
export interface ExportResponse {
  file_name: string;
  content_type: string;
  data: string;
}