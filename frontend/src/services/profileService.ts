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
 * @param payload - Fields to update.
 * @param avatarFile - Optional avatar file upload.
 */
export const updateMyProfile = async (
  payload: Partial<Profile>,
  avatarFile?: File | null,
): Promise<Profile> => {
  const { avatar: _avatar, ...rest } = payload;
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, String(value));
    });
    formData.append("avatar", avatarFile);
    const response = await api.patch<Profile>("/api/profiles/", formData);
    return response.data;
  }
  const response = await api.patch<Profile>("/api/profiles/", rest);
  return response.data;
};
