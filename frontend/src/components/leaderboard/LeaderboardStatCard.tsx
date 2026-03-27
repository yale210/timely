import { getRankValueClassName } from "@/utils/leaderboardUtils";

const LeaderboardStatCard = ({ label, value }: { label: string, value: string }) => (
  <div className="rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-3.5 shadow-sm">
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
      {label}
    </p>
    <p
      className={`mt-1.5 text-lg font-semibold ${
        label === "Friends Rank"
          ? getRankValueClassName(value)
          : "text-(--text-color)"
      }`}
    >
      {value}
    </p>
  </div>
);

export default LeaderboardStatCard;
