import api from "@/services/api"
import type { Preference, PreferenceUpdate } from "@/types";

// Helper function for preferences
export const preferenceService = {
    // Retrieve current logged-in user's preferences
    async getMyPreference(): Promise<Preference> {
        const { data } = await api.get<Preference>("/api/preferences/me/");
        return data;
    },

    // Send PATCH request to '/api/preferences/me/'
    async updateMyPreference(patch: PreferenceUpdate): Promise<Preference> {
        const { data } = await api.patch<Preference>("/api/preferences/me/", patch);
        return data;
    },
}
