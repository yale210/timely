import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyStats } from "@/types";
import { PRIMARY_BLUE } from "./constants";

function _map(stats?: WeeklyStats | null) {
  return (stats?.difficulty_stats ?? []).map((d) => ({ name: String(d.level), value: d.completed_count }));
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
export default function DifficultyBarChart({ stats }: { stats: WeeklyStats | null }) {
  if (!stats?.difficulty_stats) return <div className="h-96 flex items-center">No data...</div>;
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={_map(stats) ?? []}>
          <ChartAxes />
          <Bar dataKey="value" fill={PRIMARY_BLUE} radius={[4, 4, 0, 0]} minPointSize={5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
