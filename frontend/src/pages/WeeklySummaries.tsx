import { useState, useEffect } from "react";
import { Navbar, Footer, WeeklySummaryWidget } from "@/components";
import { getWeeklySummary } from "@/services/statsService";
import { getPastWeeks } from "@/utils/dateUtils";
import type { WeeklyStats } from "@/types";
import CompletionPieChart from "@/components/charts/CompletionPieChart";
import DifficultyBarChart from "@/components/charts/DifficultyBarChart";
import DailyTasksBarChart from "@/components/charts/DailyTasksBarChart";
import DailyTimeBarChart from "@/components/charts/DailyTimeBarChart";

const weekOptions = getPastWeeks(12);

/**
 * Renders the decorative background blobs to match the app template.
 */
const BackgroundTemplate = () => (
  <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
    <div
      style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
      className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#34d399] to-[#60a5fa] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
    />
  </div>
);

/** Renders the week selector and the progress summary card. */
const HeaderSection = ({ date, setDate, stats }: { date: string; setDate: (d: string) => void; stats: WeeklyStats | null }) => (
  <div className="flex flex-col items-center gap-6 w-full max-w-md mt-12 mb-20 z-10">
    <div className="relative z-50 w-full">
      <select value={date} onChange={(e) => setDate(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm w-full">
        {weekOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
    <WeeklySummaryWidget stats={stats} />
  </div>
);

/** Left and right analytics grid: bar chart left, pie/legend right. */
const AnalyticsGrid = ({ stats }: { stats: WeeklyStats | null }) => {
  const [mode, setMode] = useState("difficulty");
  return (
    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-32 mx-auto w-full max-w-[1400px] justify-between">
      <div>
        <div className="relative z-50 mb-6">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2 border rounded w-full max-w-xs bg-white shadow-sm cursor-pointer">
            <option value="difficulty">Difficulty</option>
            <option value="tasks">Tasks/Day</option>
            <option value="time">Time/Day</option>
          </select>
        </div>
        <div className="h-96">{mode === "difficulty" ? <DifficultyBarChart stats={stats} /> : mode === "tasks" ? <DailyTasksBarChart stats={stats} /> : <DailyTimeBarChart stats={stats} />}</div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="h-96 flex items-center justify-center"><CompletionPieChart stats={stats} /></div>
      </div>
    </div>
  );
};

/**
 * Small exported panel used by tests: bar chart left, pie right with selector.
 */
export function GraphsPanel({ stats }: { stats: WeeklyStats | null }) {
  const [mode, setMode] = useState("difficulty");
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="pl-8">
        <div className="relative z-50 mb-3">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-white shadow-sm w-48 cursor-pointer">
            <option value="difficulty">Difficulty</option>
            <option value="tasks">Tasks/Day</option>
            <option value="time">Time/Day</option>
          </select>
        </div>
        <div className="h-96">{mode === "difficulty" ? <DifficultyBarChart stats={stats} /> : mode === "tasks" ? <DailyTasksBarChart stats={stats} /> : <DailyTimeBarChart stats={stats} />}</div>
      </div>
      <div className="flex items-center justify-center"><CompletionPieChart stats={stats} /></div>
    </div>
  );
}

function useWeeklyData() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [date, setDate] = useState<string>(weekOptions[0].value);
  useEffect(() => {
    let mounted = true;
    getWeeklySummary(date).then((s) => mounted && setStats(s)).catch(console.error);
    return () => void (mounted = false);
  }, [date]);
  return { stats, date, setDate };
}

/**
 * Main analytics page. Organises header and charts into a grid.
 */
export default function WeeklySummaries() {
  const { stats, date, setDate } = useWeeklyData();
  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col font-sans text-black">
      <BackgroundTemplate />
      <Navbar />
      <main className="flex-grow flex flex-col items-center pt-24 pb-12 px-4 gap-12">
        <HeaderSection date={date} setDate={setDate} stats={stats} />
        <AnalyticsGrid stats={stats} />
      </main>
      <Footer />
    </div>
  );
}
