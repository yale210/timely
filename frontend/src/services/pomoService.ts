import api from "./api";
import { type PomoSession } from "@/types";

/**
 * Service to handle Pomodoro related API calls.
 */
export const pomoService = {
  /**
   * Records a completed focus session.
   * @param durationMinutes - The duration of the focus session in minutes.
   * @returns A promise that resolves to the recorded session data.
   */
  async recordSession(durationMinutes: number): Promise<PomoSession> {
    try {
      const response = await api.post<PomoSession>("/api/pomo/sessions/", {
        duration_minutes: durationMinutes,
        completed_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to record Pomodoro session:", error);
      throw error;
    }
  },
};
