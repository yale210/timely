/**
 * Represents a Pomodoro focus session recorded in the backend.
 */
export interface PomoSession {
  /** Unique identifier for the session. */
  id: number;
  /** Duration of the session in minutes. */
  duration_minutes: number;
  /** ISO timestamp when the session was completed. */
  completed_at: string;
  /** ISO timestamp when the session record was created. */
  created_at: string;
}
