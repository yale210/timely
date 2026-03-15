import api from "@/services/api"
import type { Preference, PreferenceUpdate } from "@/types";

export const preferenceService = {
    async getMyPreference(): Promise<Preference> {
        const { data } = await api.get<Preference>("/api/preferences/me/");
        return data;
    },

    async updateMyPreference(patch: PreferenceUpdate): Promise<Preference> {
        const { data } = await api.patch<Preference>("/api/preferences/me/", patch);
        return data;
    },
}
