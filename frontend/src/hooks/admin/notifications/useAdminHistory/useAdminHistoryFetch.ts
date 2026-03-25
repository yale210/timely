import { useEffect, useState } from "react";
import { getBroadcastHistory } from "@/api/notifications";
import { type BroadcastJobSummary } from "@/types";

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
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await getBroadcastHistory({
          page,
          q: search || undefined,
          status: statusFilter || undefined,
          target: targetFilter || undefined,
        });
        setItems(data.results);
        setCount(data.count);
        setError(null);
      } catch (err) {
        console.error("Failed to load broadcast history", err);
        setError("Failed to load broadcast history.");
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [page, search, statusFilter, targetFilter]);

  return { items, count, loading, error };
};
