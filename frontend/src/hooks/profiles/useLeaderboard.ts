import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { getMyProfile } from "@/services/profileService";
import type { Profile } from "@/types";
import { buildProfileStats, getProfileProgressStyle } from "@/utils/leaderboardUtils";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Failed to load leaderboard";

const fetchLeaderboardData = async () => {
  const [profile, response] = await Promise.all([
    getMyProfile(),
    api.get<Profile[]>("/api/profiles/leaderboard/"),
  ]);
  return { profile, leaderboard: response.data };
};

const useLeaderboardState = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return {
    error,
    isLoading,
    leaderboard,
    profile,
    setError,
    setIsLoading,
    setLeaderboard,
    setProfile,
  };
};

const useLeaderboardLoader = ({ setError, setIsLoading, setLeaderboard, setProfile }: Pick<
  ReturnType<typeof useLeaderboardState>,
  "setError" | "setIsLoading" | "setLeaderboard" | "setProfile"
>) => {
  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        setIsLoading(true);
        const data = await fetchLeaderboardData();
        if (ignore) return;
        setProfile(data.profile);
        setLeaderboard(data.leaderboard);
        setError(null);
      } catch (error) {
        if (!ignore) setError(getErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [setError, setIsLoading, setLeaderboard, setProfile]);
};

/**
 * Loads leaderboard data and exposes the derived state required by the page.
 * @returns Profile data, leaderboard entries, loading state, error state,
 * and derived profile summary metrics.
 */
export const useLeaderboard = () => {
  const state = useLeaderboardState();
  useLeaderboardLoader(state);

  const profileStats = useMemo(
    () => (state.profile ? buildProfileStats(state.profile, state.leaderboard) : null),
    [state.leaderboard, state.profile],
  );

  return {
    error: state.error,
    isLoading: state.isLoading,
    leaderboard: state.leaderboard,
    profile: state.profile,
    profileProgressStyle: profileStats
      ? getProfileProgressStyle(profileStats.progress)
      : undefined,
    profileStats,
  };
};
