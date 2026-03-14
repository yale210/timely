import { useCallback, useEffect, useState } from "react";
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

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const profile = await getPublicProfile(username);
      setState({ profile, loading: false, error: null });
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setState({ profile: null, loading: false, error: parsed.message });
    }
  }, [username]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return state;
};
