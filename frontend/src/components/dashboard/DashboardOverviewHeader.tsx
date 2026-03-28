import type { OverviewPeriod } from "@/components/dashboard/dashboardOverviewTypes";

interface DashboardOverviewHeaderProps {
  periodLabel: string;
  selectedPeriod: OverviewPeriod;
  onPeriodChange: (period: OverviewPeriod) => void;
}

const PERIOD_OPTIONS: { label: string; value: OverviewPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All-Time", value: "all_time" },
];

/**
 * Renders the dashboard heading and period selector.
 * @param props - Header state and callbacks.
 * @param props.periodLabel - Current label for the selected overview period.
 * @param props.selectedPeriod - Active overview period value.
 * @param props.onPeriodChange - Callback used when the period selection changes.
 * @returns The dashboard header row.
 */
export default function DashboardOverviewHeader({
  periodLabel,
  selectedPeriod,
  onPeriodChange,
}: DashboardOverviewHeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-black">{periodLabel} Overview</h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500" htmlFor="overview-period">
          Period
        </label>
        <select
          id="overview-period"
          value={selectedPeriod}
          onChange={(event) => onPeriodChange(event.target.value as OverviewPeriod)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-primary"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
