import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import type { WeeklyStats } from "@/types";
import { PRIMARY_BLUE, LIGHT_GREY } from "./constants";

function _mapData(stats: WeeklyStats) {
  const done = stats.completed_tasks;
  const not = stats.total_tasks - done;
  return [
    { name: "Done", value: done, fill: PRIMARY_BLUE },
    { name: "Not Done", value: not, fill: LIGHT_GREY },
  ];
}

const PieConfigs = () => (
  <>
    <Tooltip />
    <Legend verticalAlign="bottom" height={36} iconType="circle" />
  </>
);

const LoadingState = () => <div className="w-72 h-72 flex items-center justify-center">Loading…</div>;
const NoDataCircle = () => <div className="w-72 h-72 rounded-full bg-gray-200" />;

/** Completion Pie showing done vs not done with legend. */
export default function CompletionPieChart({ stats }: { stats: WeeklyStats | null }) {
  if (!stats) return <LoadingState />;
  if (stats.total_tasks === 0) return <NoDataCircle />;
  const data = _mapData(stats);
  return (
    <PieChart width={350} height={350}>
      <Pie dataKey="value" data={data} innerRadius={70} outerRadius={120} paddingAngle={5}>
        {data.map((entry) => (
          <Cell key={entry.name} fill={entry.fill} />
        ))}
      </Pie>
      <PieConfigs />
    </PieChart>
  );
}
