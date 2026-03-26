import AppLayout from "@/layouts/AppLayout";
import LeaderboardProfileCard from "@/components/leaderboard/LeaderboardProfileCard";
import LeaderboardStandings from "@/components/leaderboard/LeaderboardStandings";
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
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-5">
            <h1 className="text-2xl font-bold text-[color:var(--text-color)]">Leaderboard</h1>
          </div>
        </header>

        <main className="px-4 py-6 text-[color:var(--text-color)] sm:px-6">
          <div className="flex w-full flex-col gap-6">
            {isLoading && <p className="text-sm text-gray-500">Loading leaderboard...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!isLoading && !error && (
              <>
                <LeaderboardProfileCard
                  profile={profile}
                  profileStats={profileStats}
                />
                <div className="h-px w-full bg-linear-to-r from-transparent via-gray-300 to-transparent" />
                <LeaderboardStandings leaderboard={leaderboard} />
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
