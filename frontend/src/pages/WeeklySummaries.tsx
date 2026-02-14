import { useState, useEffect } from "react";
import { Navbar, Footer, WeeklySummaryWidget } from "@/components";
import { getWeeklySummary } from "@/services/statsService";
import { getPastWeeks } from "@/utils/dateUtils";
import { type WeeklyStats } from "@/types";

const weekOptions = getPastWeeks(12);

const WeekSelector = ({ date, onChange }: { date: string; onChange: (d: string) => void }) => (
  <select
    value={date}
    onChange={(e) => onChange(e.target.value)}
    className="p-2 border border-gray-300 rounded-md shadow-sm w-full max-w-xs"
  >
    {weekOptions.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

/**
 * A page for viewing weekly analytics with history.
 */
export default function WeeklySummaries() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [date, setDate] = useState<string>(weekOptions[0].value);

  const handleDateChange = (d: string) => {
    setStats(null); // Show loading state on change
    setDate(d);
  };

  useEffect(() => {
    let mounted = true;
    getWeeklySummary(date)
      .then((s) => {
        if (mounted) setStats(s);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [date]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-6 flex flex-col items-center justify-center gap-8">
        <WeekSelector date={date} onChange={handleDateChange} />
        <div className="w-full max-w-lg">
          <WeeklySummaryWidget stats={stats} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
