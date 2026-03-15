/**
 * Represents weekly task statistics.
 * @interface WeeklyStats
 */
export interface WeeklyStats {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  total_minutes_planned: number;
  daily_stats: { day: string; completed_count: number; total_minutes: number }[];
  importance_stats: { level: number; completed_count: number }[];
}
