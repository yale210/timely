import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyStats } from "@/types";
import { PRIMARY_BLUE } from "@/components/charts/constants";

function _map(stats?: WeeklyStats | null) {
  return (stats?.daily_stats ?? []).map((d) => ({ name: d.day, value: d.total_minutes }));
}

const ChartAxes = ({ x, y }: { x: string; y: string }) => (
  <>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
    <XAxis dataKey="name" label={{ value: x, position: "insideBottom", offset: -10, fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
    <YAxis label={{ value: y, angle: -90, position: "insideLeft", fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
    <Tooltip cursor={{ fill: "#f8fafc" }} />
  </>
);

/**
 * Daily time bar chart.
 * @param props - Component props.
 * @param props.stats - Weekly statistics (may be null while loading).
 */
export default function DailyTimeBarChart({ stats }: { stats: WeeklyStats | null }) {
  if (!stats) return <div>Loading…</div>;
  const data = _map(stats);
  return (
    <div className="h-96 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <ChartAxes x="Day of Week" y="Minutes Spent" />
          <Bar dataKey="value" fill={PRIMARY_BLUE} minPointSize={5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
