import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import type { WeeklyStats } from "@/types";
import { PRIMARY_BLUE, LIGHT_GREY } from "./constants";

/**
 * Maps weekly stats to chart data and filters out zero-value segments so a full
 * completion shows as a single solid segment.
 * @param stats - The weekly statistics data used to generate chart segments.
 */
function _mapData(stats: WeeklyStats) {
  const done = stats.completed_tasks;
  const not = stats.total_tasks - done;
  const raw = [
    { name: "Done", value: done, fill: PRIMARY_BLUE },
    { name: "Not Done", value: not, fill: LIGHT_GREY },
  ];
  return raw.filter((item) => item.value > 0);
}

const PieConfigs = () => (
  <>
    <Tooltip />
    <Legend verticalAlign="bottom" height={36} iconType="circle" />
  </>
);

const LoadingState = () => <div className="w-72 h-72 flex items-center justify-center">Loading…</div>;
const NoDataCircle = () => <div className="w-72 h-72 rounded-full bg-gray-200" />;

/**
 * Completion pie showing done vs not done with legend.
 * @param props - Component props
 * @param props.stats - Weekly statistics for the current week
 */
export default function CompletionPieChart(props: { stats: WeeklyStats | null }) {
  const { stats } = props;
  if (!stats) return <LoadingState />;
  if (stats.total_tasks === 0) return <NoDataCircle />;
  const chartData = _mapData(stats);
  const gap = chartData.length > 1 ? 5 : 0;
  return (
    <PieChart width={350} height={350}>
      <Pie dataKey="value" data={chartData} innerRadius={70} outerRadius={120} paddingAngle={gap}>
        {chartData.map((entry) => (
          <Cell key={entry.name} fill={entry.fill} />
        ))}
      </Pie>
      <PieConfigs />
    </PieChart>
  );
}
