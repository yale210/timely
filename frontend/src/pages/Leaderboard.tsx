import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import AppLayout from "@/layouts/AppLayout";
import api from "@/services/api";
import { getMyProfile } from "@/services/profileService";
import type { Profile } from "@/types";

const getRequiredExp = (level: number) => {
  const nextLevel = Math.max(1, level + 1);
  return Math.round(100 * nextLevel ** 1.5);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getProgressMetrics = (profile: Profile) => {
  const level = profile.level ?? 0;
  const xp = profile.xp ?? 0;
  const requiredExp = getRequiredExp(level);
  const progress = requiredExp > 0 ? clamp((xp / requiredExp) * 100, 0, 100) : 0;

  return {
    level,
    progress,
    requiredExp,
    xp,
    xpRemaining: Math.max(requiredExp - xp, 0),
  };
};

const formatJoinedDate = (value?: string | null) => {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getAvatarFallback = (name?: string | null) => {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getPlacementAccent = (index: number) => {
  if (index === 0) {
    return {
      iconClassName: "text-amber-500",
      label: "1st place",
      rankClassName: "text-amber-600",
      ringClassName: "ring-amber-200",
    };
  }

  if (index === 1) {
    return {
      iconClassName: "text-slate-400",
      label: "2nd place",
      rankClassName: "text-slate-500",
      ringClassName: "ring-slate-200",
    };
  }

  if (index === 2) {
    return {
      iconClassName: "text-orange-600",
      label: "3rd place",
      rankClassName: "text-orange-700",
      ringClassName: "ring-orange-200",
    };
  }

  return {
    iconClassName: "text-transparent",
    label: "",
    rankClassName: "text-gray-300",
    ringClassName: "ring-gray-200",
  };
};

const getRankValueClassName = (value: string) => {
  if (value === "#1") return "text-amber-500";
  if (value === "#2") return "text-slate-400";
  if (value === "#3") return "text-orange-600";
  return "text-[color:var(--text-color)]";
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-3.5 shadow-sm">
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">{label}</p>
    <p className={`mt-1.5 text-lg font-semibold ${label === "Friends Rank" ? getRankValueClassName(value) : "text-[color:var(--text-color)]"}`}>
      {value}
    </p>
  </div>
);

const getNameClassName = (name: string) => {
  const length = name.trim().length;

  if (length > 24) {
    return "text-base sm:text-lg";
  }

  if (length > 18) {
    return "text-lg sm:text-xl";
  }

  return "text-xl sm:text-[1.55rem]";
};

const LeaderboardEntry = ({ entry, index }: { entry: Profile; index: number }) => {
  const { level, progress, requiredExp } = getProgressMetrics(entry);
  const progressStyle = { "--xp-progress": `${progress}%` } as CSSProperties;
  const placementAccent = getPlacementAccent(index);
  const nameClassName = getNameClassName(entry.name);

  return (
    <li
      className={`w-full rounded-[1.5rem] border border-gray-200 bg-white px-5 py-3.5 shadow-sm ring-1 ${placementAccent.ringClassName} sm:px-6`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-4 sm:min-w-[9rem]">
          <div className="flex items-center gap-3">
            {index < 3 ? (
              <TrophyIcon className={`h-6 w-6 ${placementAccent.iconClassName}`} aria-hidden="true" />
            ) : (
              <div className="h-6 w-6" aria-hidden="true" />
            )}
            <span className={`text-3xl font-bold leading-none tracking-[-0.03em] sm:text-[2.25rem] ${placementAccent.rankClassName}`}>
              #{index + 1}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="min-w-0 lg:w-[10.5rem] xl:w-[12rem]">
              <p className={`truncate font-semibold text-[color:var(--text-color)] ${nameClassName}`}>{entry.name}</p>
            </div>

            <div className="min-w-0 lg:-ml-4 lg:flex-1">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                <span>Level {level}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-1.5 h-3 w-full rounded-full bg-gray-100">
                <div
                  className="xp-progress-fill h-3 rounded-full bg-cyan-500"
                  style={progressStyle}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {entry.xp ?? 0} / {requiredExp} XP
              </p>
            </div>
          </div>
        </div>
      </div>
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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const profileStats = useMemo(() => {
    if (!profile) return null;

    const { level, progress, requiredExp, xp, xpRemaining } = getProgressMetrics(profile);
    const rankIndex = leaderboard.findIndex((entry) => entry.name === profile.name);
    return {
      avatarFallback: getAvatarFallback(profile.name),
      joinedDate: formatJoinedDate(profile.creation_date),
      level,
      progress,
      rank: rankIndex >= 0 ? `#${rankIndex + 1}` : "Unranked",
      requiredExp,
      slogan: profile.slogan?.trim() || null,
      xp,
      xpRemaining,
    };
  }, [leaderboard, profile]);

  const profileProgressStyle = profileStats
    ? ({ "--xp-progress": `${profileStats.progress}%` } as CSSProperties)
    : undefined;

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
                <section className="rounded-[2rem] border border-gray-200 bg-linear-to-br from-white via-cyan-50/60 to-white px-5 py-6 shadow-sm sm:px-7">
                  <div className="flex flex-col gap-6">
                    {profile && profileStats ? (
                      <>
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/70 bg-cyan-600 text-2xl font-bold text-white shadow-sm">
                                {profile.avatar ? (
                                  <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  profileStats.avatarFallback
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                                  My Progress
                                </p>
                                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--text-color)]">
                                  {profile.name}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                  {profile.bio?.trim() || "Add a bio to make your profile card feel more personal."}
                                </p>
                                {profileStats.slogan && (
                                  <p className="mt-3 text-sm font-medium text-gray-500">
                                    &quot;{profileStats.slogan}&quot;
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
                              <StatCard label="Joined" value={profileStats.joinedDate} />
                              <StatCard label="Total XP" value={`${profileStats.xp} XP`} />
                              <StatCard label="Friends Rank" value={profileStats.rank} />
                            </div>
                          </div>

                          <div className="rounded-3xl border border-cyan-100 bg-white/80 p-4">
                            <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                              <span>Level {profileStats.level}</span>
                              <span>{profileStats.progress}%</span>
                            </div>

                            <div className="mt-2.5">
                              <div className="mt-2 h-3 w-full rounded-full bg-white ring-1 ring-cyan-100">
                                <div
                                  className="xp-progress-fill h-3 rounded-full bg-cyan-500"
                                  style={profileProgressStyle}
                                />
                              </div>
                              <p className="mt-1.5 text-sm text-gray-500">
                                {profileStats.xp} / {profileStats.requiredExp} XP toward Level {profileStats.level + 1}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No profile data available.</p>
                    )}
                  </div>
                </section>

                <div className="h-px w-full bg-linear-to-r from-transparent via-gray-300 to-transparent" />

                <section className="mx-auto w-full max-w-6xl">
                  <div className="mb-4 flex items-center justify-between gap-4 px-1">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">
                        Friends Leaderboard
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text-color)]">
                        Full standings
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500">{leaderboard.length} ranked friends</p>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-8 text-sm text-gray-500">
                      No friends yet.
                    </div>
                  ) : (
                    <ul className="space-y-4">
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
