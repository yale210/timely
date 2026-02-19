import api from "@/services/api"
import type { Preference, PreferenceUpdate } from "../types";

export async function getMyPreference(): Promise<Preference> {
    const { data } = await api.get<Preference>("api/preferences/me");
    return data;
}

export async function updateMyPreference(patch: PreferenceUpdate): Promise<Preference> {
    const { data } = await api.patch<Preference>("api/preferences/me", patch);
    return data;
}