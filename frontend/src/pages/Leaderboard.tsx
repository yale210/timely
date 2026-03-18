import { useEffect, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import { getMyProfile } from "@/services/profileService";
import type { Profile } from "@/types";

const getRequiredExp = (level: number) => {
  const nextLevel = Math.max(1, level + 1);
  return Math.round(100 * nextLevel ** 1.5);
};

const LeaderboardEntry = ({ entry, index }: { entry: Profile; index: number }) => {
  const level = entry.level ?? 0;
  const xp = entry.xp ?? 0;
  const requiredExp = getRequiredExp(level);
  const progress = requiredExp > 0 ? Math.min(100, (xp / requiredExp) * 100) : 0;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    setAnimatedProgress(0);
    const frame = window.requestAnimationFrame(() => {
      setAnimatedProgress(progress);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <li className="rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">#{index + 1} {entry.name}</p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {xp} XP
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-cyan-500 transition-all duration-700"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {xp} / {requiredExp} XP to next level
      </p>
    </li>
  );
};

const Leaderboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profileData, leaderboardResponse] = await Promise.all([
          getMyProfile(),
          api.get<Profile[]>("/api/profiles/leaderboard/"),
        ]);

        if (!isMounted) return;
        setProfile(profileData);
        setLeaderboard(leaderboardResponse.data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load leaderboard";
        setError(message);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
        </header>

        <main className="p-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            {isLoading && <p className="text-sm text-gray-500">Loading leaderboard...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!isLoading && !error && (
              <>
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">My Progress</h2>
                  {profile ? (
                    <div className="mt-4 grid gap-2 text-sm text-gray-700">
                      <p className="text-base font-medium text-gray-900">{profile.name}</p>
                      <p>Level: {profile.level ?? 0}</p>
                      <p>EXP: {profile.xp ?? 0}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">No profile data available.</p>
                  )}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Friends Leaderboard</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">XP</span>
                  </div>
                  {leaderboard.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">No friends yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {leaderboard.map((entry, index) => (
                        <LeaderboardEntry key={`${entry.name}-${index}`} entry={entry} index={index} />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
