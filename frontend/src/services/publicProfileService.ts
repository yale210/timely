import api from "@/services/api";
import type { PublicProfile } from "@/types";

/**
 * Fetches a public profile by username.
 * @param username - The username to look up.
 */
export const getPublicProfile = async (username: string): Promise<PublicProfile> => {
  const response = await api.get<PublicProfile>(`/api/profiles/${username}/`);
  return response.data;
};
