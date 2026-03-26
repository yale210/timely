import type { Profile } from "@/types";
import LeaderboardEntry from "./LeaderboardEntry";

interface LeaderboardStandingsProps {
  leaderboard: Profile[];
}

const LeaderboardStandingsHeader = ({ count }: { count: number }) => (
  <div className="mb-4 flex items-center justify-between gap-4 px-1">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">
        Friends Leaderboard
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-(--text-color)">
        Full standings
      </h2>
    </div>
    <p className="text-sm text-gray-500">{count} ranked friends</p>
  </div>
);

const LeaderboardStandingsBody = ({ leaderboard }: LeaderboardStandingsProps) =>
  leaderboard.length === 0 ? (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-8 text-sm text-gray-500">
      No friends yet.
    </div>
  ) : (
    <ul className="space-y-4">
      {leaderboard.map((entry, index) => (
        <LeaderboardEntry
          key={`${entry.name}-${index}`}
          entry={entry}
          index={index}
        />
      ))}
    </ul>
  );

const LeaderboardStandings = ({
  leaderboard,
}: LeaderboardStandingsProps) => (
  <section className="mx-auto w-full max-w-6xl">
    <LeaderboardStandingsHeader count={leaderboard.length} />
    <LeaderboardStandingsBody leaderboard={leaderboard} />
  </section>
);

export default LeaderboardStandings;
