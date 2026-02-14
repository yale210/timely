import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components";
import WeeklySummaryWidget from "@/components/WeeklySummaryWidget";
import { getWeeklySummary } from "@/services/statsService";
import { getPastWeeks } from "@/utils/dateUtils";
import type { WeeklyStats } from "@/types";

const weekOptions = getPastWeeks(12);

const WeekSelector = ({ date, onChange }: { date: string; onChange: (d: string) => void }) => (
  <div className="w-full max-w-lg">
    <label className="block text-sm text-gray-600 mb-2">Select week</label>
    <select value={date} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border-gray-200 p-2">
      {weekOptions.map((w) => (
        <option key={w.value} value={w.value}>{w.label}</option>
      ))}
    </select>
  </div>
);

/** A page for viewing weekly analytics with history. */
export default function WeeklySummaries() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [date, setDate] = useState<string>(weekOptions[0].value);

  useEffect(() => {
    setStats(null);
    getWeeklySummary(date).then(setStats).catch(console.error);
  }, [date]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-6 flex flex-col items-center gap-8">
        <WeekSelector date={date} onChange={setDate} />
        <div className="w-full max-w-lg">
          <WeeklySummaryWidget stats={stats} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
