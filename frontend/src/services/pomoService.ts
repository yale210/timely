import api from "./api";

/**
 * Service to handle Pomodoro related API calls.
 */
export const pomoService = {
  /**
   * Records a completed focus session.
   * @param durationMinutes - The duration of the focus session in minutes.
   */
  async recordSession(durationMinutes: number) {
    try {
      const response = await api.post("/api/pomo/sessions/", {
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
