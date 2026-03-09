import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeeklySummary } from "@/services/statsService";
import type { WeeklyStats } from "@/types";
import { getPastWeeks } from "@/utils/dateUtils";

/**
 * Supported chart modes for the weekly summaries graphs.
 */
export type AnalyticsChartMode = "importance" | "tasks" | "time";

interface WeekOption {
  value: string;
  label: string;
}

interface WeeklySummariesState {
  stats: WeeklyStats | null;
  selectedWeek: string;
  weekOptions: WeekOption[];
  chartMode: AnalyticsChartMode;
}

interface WeeklySummariesLoading {
  summary: boolean;
}

interface WeeklySummariesError {
  summary: string | null;
}

interface WeeklySummariesActions {
  setSelectedWeek: (nextWeek: string) => void;
  setChartMode: (nextMode: AnalyticsChartMode) => void;
  refresh: () => Promise<void>;
}

/**
 * Describes the structured weekly summaries hook contract.
 */
export interface UseWeeklySummariesReturn {
  state: WeeklySummariesState;
  loading: WeeklySummariesLoading;
  error: WeeklySummariesError;
  actions: WeeklySummariesActions;
}

/**
 * Provides the selected week, analytics mode, and fetched weekly summary data.
 * @returns Structured weekly summaries state, loading, error, and actions.
 */
export const useWeeklySummaries = (): UseWeeklySummariesReturn => {
  const weekOptions = useMemo<WeekOption[]>(() => getPastWeeks(12), []);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>(weekOptions[0]?.value ?? "");
  const [chartMode, setChartMode] = useState<AnalyticsChartMode>("importance");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedWeek) {
      setStats(null);
      setIsSummaryLoading(false);
      return;
    }

    setIsSummaryLoading(true);

    try {
      const nextStats = await getWeeklySummary(selectedWeek);
      setStats(nextStats);
      setSummaryError(null);
    } catch (error) {
      console.error(error);
      setStats(null);
      setSummaryError("Failed to load weekly summary.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state: {
      stats,
      selectedWeek,
      weekOptions,
      chartMode,
    },
    loading: {
      summary: isSummaryLoading,
    },
    error: {
      summary: summaryError,
    },
    actions: {
      setSelectedWeek,
      setChartMode,
      refresh,
    },
  };
};
