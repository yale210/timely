import type { Profile } from "@/types";
import type { LeaderboardProfileStats } from "./leaderboardUtils";
import LeaderboardProfileCard from "./LeaderboardProfileCard";
import LeaderboardStandings from "./LeaderboardStandings";

interface LeaderboardContentProps {
  error: string | null;
  isLoading: boolean;
  leaderboard: Profile[];
  profile: Profile | null;
  profileStats: LeaderboardProfileStats | null;
}

const LeaderboardContent = ({
  error,
  isLoading,
  leaderboard,
  profile,
  profileStats,
}: LeaderboardContentProps) => (
  <main className="px-4 py-6 text-[color:var(--text-color)] sm:px-6">
    <div className="flex w-full flex-col gap-6">
      {isLoading && <p className="text-sm text-gray-500">Loading leaderboard...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <>
          <LeaderboardProfileCard profile={profile} profileStats={profileStats} />
          <div className="h-px w-full bg-linear-to-r from-transparent via-gray-300 to-transparent" />
          <LeaderboardStandings leaderboard={leaderboard} />
        </>
      )}
    </div>
  </main>
);

export default LeaderboardContent;
