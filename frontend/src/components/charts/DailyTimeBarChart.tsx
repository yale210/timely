import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyStats } from "@/types";
import { PRIMARY_BLUE } from "./constants";

function _map(stats?: WeeklyStats | null) {
  return (stats?.daily_stats ?? []).map((d) => ({ name: d.day, value: d.total_minutes }));
}

const ChartAxes = () => (
  <>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
    <XAxis dataKey="name" axisLine={false} tickLine={false} />
    <YAxis axisLine={false} tickLine={false} />
    <Tooltip cursor={{ fill: "#f8fafc" }} />
  </>
);

/**
 *
 * @param root0
 * @param root0.stats
 */
export default function DailyTimeBarChart({ stats }: { stats: WeeklyStats | null }) {
  if (!stats) return <div>Loading…</div>;
  const data = _map(stats);
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []}>
          <ChartAxes />
          <Bar dataKey="value" fill={PRIMARY_BLUE} minPointSize={5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
