import { TrophyIcon } from "@heroicons/react/24/solid";
import type { Profile } from "@/types";
import {
  getNameClassName,
  getPlacementAccent,
  getProfileProgressStyle,
  getProgressMetrics,
} from "./leaderboardUtils";

interface LeaderboardEntryProps {
  entry: Profile;
  index: number;
}

const LeaderboardEntryPlacement = ({ index }: { index: number }) => {
  const placementAccent = getPlacementAccent(index);
  return (
    <div className="flex items-center gap-3">
      {index < 3 ? (
        <TrophyIcon
          className={`h-6 w-6 ${placementAccent.iconClassName}`}
          aria-hidden="true"
        />
      ) : (
        <div className="h-6 w-6" aria-hidden="true" />
      )}
      <span className={`text-3xl font-bold leading-none tracking-[-0.03em] sm:text-[2.25rem] ${placementAccent.rankClassName}`}>
        #{index + 1}
      </span>
    </div>
  );
};

const LeaderboardEntryProgress = ({ entry }: { entry: Profile }) => {
  const { level, progress, requiredExp } = getProgressMetrics(entry);
  const progressStyle = getProfileProgressStyle(progress);
  return (
    <div className="min-w-0 lg:-ml-4 lg:flex-1">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
        <span>Level {level}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mt-1.5 h-3 w-full rounded-full bg-gray-100">
        <div className="xp-progress-fill h-3 rounded-full bg-cyan-500" style={progressStyle}/>
      </div>
      <p className="mt-1 text-xs text-gray-500"> {entry.xp ?? 0} / {requiredExp} XP </p>
    </div>
  );
};

const LeaderboardEntry = ({ entry, index }: LeaderboardEntryProps) => {
  const placementAccent = getPlacementAccent(index);
  const nameClassName = getNameClassName(entry.name);

  return (
    <li className={`w-full rounded-[1.5rem] border border-gray-200 bg-white px-5 py-3.5 shadow-sm ring-1 ${placementAccent.ringClassName} sm:px-6`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-4 sm:min-w-[9rem]">
          <LeaderboardEntryPlacement index={index} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="min-w-0 lg:w-[10.5rem] xl:w-[12rem]">
              <p className={`truncate font-semibold text-[color:var(--text-color)] ${nameClassName}`}>
                {entry.name}
              </p>
            </div>
            <LeaderboardEntryProgress entry={entry} />
          </div>
        </div>
      </div>
    </li>
  );
};

export default LeaderboardEntry;
