import { useEffect, useState } from "react";
import type { PublicProfile } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import { getPublicProfile } from "@/services/publicProfileService";

interface PublicProfileState {
  profile: PublicProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads a public profile by username.
 * @param username - Username to query.
 */
export const usePublicProfile = (username: string | null) => {
  const [state, setState] = useState<PublicProfileState>({
    profile: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    let isActive = true;
    if (!username) {
      queueMicrotask(() => {
        if (!isActive) return;
        setState({ profile: null, loading: false, error: null });
      });
      return () => {
        isActive = false;
      };
    }
    const fetchProfile = async () => {
      queueMicrotask(() => {
        if (!isActive) return;
        setState((prev) => ({ ...prev, loading: true, error: null }));
      });
      try {
        const profile = await getPublicProfile(username);
        if (!isActive) return;
        setState({ profile, loading: false, error: null });
      } catch (error) {
        const parsed = formatDjangoFormError(error);
        if (!isActive) return;
        setState({ profile: null, loading: false, error: parsed.message });
      }
    };
    void fetchProfile();
    return () => {
      isActive = false;
    };
  }, [username]);

  return state;
};
