import { useEffect, useState } from "react";
import { getBroadcastHistory } from "@/api/notifications";
import { type BroadcastJobSummary } from "@/types";

const getHistoryFilters = (search: string, statusFilter: string, targetFilter: string) => ({
  q: search || undefined,
  status: statusFilter || undefined,
  target: targetFilter || undefined,
});

/**
 * Hook to fetch admin notification broadcast history.
 * @param page - Current page.
 * @param search - Current search query.
 * @param statusFilter - Current status filter.
 * @param targetFilter - Current target filter.
 * @returns Items, count, loading, and error states.
 */
export const useAdminHistoryFetch = (
  page: number,
  search: string,
  statusFilter: string,
  targetFilter: string
) => {
  const [items, setItems] = useState<BroadcastJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void getBroadcastHistory({ page, ...getHistoryFilters(search, statusFilter, targetFilter) })
      .then((data) => {
        setItems(data.results);
        setCount(data.count);
        setError(null);
      })
      .catch((error: unknown) => {
        console.error("Failed to load broadcast history", error);
        setError("Failed to load broadcast history.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, search, statusFilter, targetFilter]);

  return { items, count, loading, error };
};
