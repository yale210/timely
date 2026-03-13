import api from "@/services/api";
import type { Profile } from "@/types";

/**
 * Fetches the current user's profile.
 */
export const getMyProfile = async (): Promise<Profile> => {
  const response = await api.get<Profile>("/api/profiles/");
  return response.data;
};

/**
 * Updates the current user's profile.
 */
export const updateMyProfile = async (
  payload: Partial<Profile>,
  avatarFile?: File | null,
): Promise<Profile> => {
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    formData.append("avatar", avatarFile);
    const response = await api.patch<Profile>("/api/profiles/", formData);
    return response.data;
  }
  const response = await api.patch<Profile>("/api/profiles/", payload);
  return response.data;
};
