import type { Profile } from "@/types";
import type { LeaderboardProfileStats } from "./leaderboardUtils";
import { getProfileProgressStyle } from "./leaderboardUtils";
import LeaderboardStatCard from "./LeaderboardStatCard";

interface LeaderboardProfileCardProps {
  profile: Profile | null;
  profileStats: LeaderboardProfileStats | null;
}

interface LeaderboardProfileAvatarProps {
  avatar: string | null;
  avatarFallback: string;
  name: string;
}

interface LeaderboardProfileTextProps {
  bio?: string | null;
  name: string;
  slogan: string | null;
}

interface LeaderboardProfileIdentityProps {
  profile: Profile;
  avatarFallback: string;
  slogan: string | null;
}

interface LeaderboardProfileProgressProps {
  level: number;
  progress: number;
  requiredExp: number;
  xp: number;
}

const EMPTY_BIO_TEXT = "Add a bio to make your profile card feel more personal.";

const LeaderboardProfileEmptyState = () => (
  <section className="rounded-[2rem] border border-gray-200 bg-linear-to-br from-white via-cyan-50/60 to-white px-5 py-6 shadow-sm sm:px-7">
    <p className="text-sm text-gray-500">No profile data available.</p>
  </section>
);

const LeaderboardProfileAvatar = ({ avatar, avatarFallback, name}: LeaderboardProfileAvatarProps) => (
  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/70 bg-cyan-600 text-2xl font-bold text-white shadow-sm">
    {avatar ? (
      <img src={avatar} alt={name} className="h-full w-full object-cover" />
    ) : (
      avatarFallback
    )}
  </div>
);

const LeaderboardProfileText = ({bio, name, slogan}: LeaderboardProfileTextProps) => (
  <div>
    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
      My Progress
    </p>
    <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--text-color)]">
      {name}
    </h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
      {bio?.trim() ? bio.trim() : EMPTY_BIO_TEXT}
    </p>
    {slogan && (
      <p className="mt-3 text-sm font-medium text-gray-500">
        &quot;{slogan}&quot;
      </p>
    )}
  </div>
);

const LeaderboardProfileIdentity = ({ profile, avatarFallback, slogan }: LeaderboardProfileIdentityProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
    <LeaderboardProfileAvatar
      avatar={profile.avatar}
      avatarFallback={avatarFallback}
      name={profile.name}
    />
    <LeaderboardProfileText bio={profile.bio} name={profile.name} slogan={slogan} />
  </div>
);

const LeaderboardProfileProgressBar = ({ progressStyle }: {
  progressStyle: ReturnType<typeof getProfileProgressStyle>;
}) => (
  <div className="mt-2 h-3 w-full rounded-full bg-white ring-1 ring-cyan-100">
    <div
      className="xp-progress-fill h-3 rounded-full bg-cyan-500"
      style={progressStyle}
    />
  </div>
);

const LeaderboardProfileProgress = ({ level, progress, requiredExp, xp }: LeaderboardProfileProgressProps ) => {
  const progressStyle = getProfileProgressStyle(progress);
  const roundedProgress = Math.round(progress);
  return (
    <div className="rounded-3xl border border-cyan-100 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
        <span>Level {level}</span>
        <span>{roundedProgress}%</span>
      </div>
      <div className="mt-2.5">
        <LeaderboardProfileProgressBar progressStyle={progressStyle} />
        <p className="mt-1.5 text-sm text-gray-500">
          {xp} / {requiredExp} XP toward Level {level + 1}
        </p>
      </div>
    </div>
  );
};

const LeaderboardProfileStatsGrid = ({
  joinedDate,
  rank,
  xp,
}: {
  joinedDate: string;
  rank: string;
  xp: number;
}) => (
  <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
    <LeaderboardStatCard label="Joined" value={joinedDate} />
    <LeaderboardStatCard label="Total XP" value={`${xp} XP`} />
    <LeaderboardStatCard label="Friends Rank" value={rank} />
  </div>
);

const LeaderboardProfileCardContent = ({ profile, profileStats }: { profile: Profile; profileStats: LeaderboardProfileStats;}) => (
  <section className="rounded-[2rem] border border-gray-200 bg-linear-to-br from-white via-cyan-50/60 to-white px-5 py-6 shadow-sm sm:px-7">
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <LeaderboardProfileIdentity
          profile={profile}
          avatarFallback={profileStats.avatarFallback}
          slogan={profileStats.slogan}
        />
        <LeaderboardProfileStatsGrid
          joinedDate={profileStats.joinedDate}
          rank={profileStats.rank}
          xp={profileStats.xp}
        />
      </div>
      <LeaderboardProfileProgress
        level={profileStats.level}
        progress={profileStats.progress}
        requiredExp={profileStats.requiredExp}
        xp={profileStats.xp}
      />
    </div>
  </section>
);

const LeaderboardProfileCard = ({ profile, profileStats }: LeaderboardProfileCardProps) => {
  if (!profile || !profileStats) {
    return <LeaderboardProfileEmptyState />;
  }

  return <LeaderboardProfileCardContent profile={profile} profileStats={profileStats} />;
};

export default LeaderboardProfileCard;
