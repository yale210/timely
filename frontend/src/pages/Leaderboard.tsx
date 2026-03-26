import AppLayout from "@/layouts/AppLayout";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import LeaderboardHeader from "@/components/leaderboard/LeaderboardHeader";
import { useLeaderboard } from "@/hooks/profiles/useLeaderboard";

/**
 * Renders the current user's leaderboard summary alongside the friends standings list.
 *
 * @returns The leaderboard page layout and content.
 */
export default function Leaderboard() {
  const { error, isLoading, leaderboard, profile, profileStats } = useLeaderboard();

  return (
    <AppLayout>
      <div className="flex min-h-full flex-col">
        <LeaderboardHeader />
        <LeaderboardContent
          error={error}
          isLoading={isLoading}
          leaderboard={leaderboard}
          profile={profile}
          profileStats={profileStats}
        />
      </div>
    </AppLayout>
  );
}
