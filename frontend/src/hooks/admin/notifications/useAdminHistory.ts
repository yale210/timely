import { useEffect, useMemo, useState } from "react";
import { getBroadcastHistory } from "@/api/notifications";
import { type BroadcastJobSummary } from "@/types";

const getHistoryFilters = (search: string, statusFilter: string, targetFilter: string) => ({
  q: search || undefined,
  status: statusFilter || undefined,
  target: targetFilter || undefined,
});

interface AdminHistoryState {
  items: BroadcastJobSummary[];
  search: string;
  statusFilter: string;
  targetFilter: string;
  page: number;
  count: number;
  totalPages: number;
}

interface AdminHistoryActions {
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setTargetFilter: (value: string) => void;
  setPage: (page: number) => void;
}

interface UseAdminHistoryReturn {
  state: AdminHistoryState;
  loading: boolean;
  error: string | null;
  actions: AdminHistoryActions;
}

/**
 * Hook to manage state for admin notification history.
 * @returns History state and actions.
 */
export const useAdminHistoryState = () => {
  const [search, setSearchState] = useState("");
  const [statusFilter, setStatusFilterState] = useState("");
  const [targetFilter, setTargetFilterState] = useState("");
  const [page, setPage] = useState(1);

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setStatusFilter = (value: string) => {
    setStatusFilterState(value);
    setPage(1);
  };

  const setTargetFilter = (value: string) => {
    setTargetFilterState(value);
    setPage(1);
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    targetFilter,
    setTargetFilter,
    page,
    setPage,
  };
};

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
  targetFilter: string,
) => {
  const [items, setItems] = useState<BroadcastJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void getBroadcastHistory({
      page,
      ...getHistoryFilters(search, statusFilter, targetFilter),
    })
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

/**
 * Loads and filters admin notification broadcast history.
 * @returns History state, loading state, errors, and update actions.
 */
export const useAdminHistory = (): UseAdminHistoryReturn => {
  const s = useAdminHistoryState();
  const f = useAdminHistoryFetch(s.page, s.search, s.statusFilter, s.targetFilter);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(f.count / 50)), [f.count]);

  return {
    state: { items: f.items, search: s.search, statusFilter: s.statusFilter, targetFilter: s.targetFilter, page: s.page, count: f.count, totalPages },
    loading: f.loading,
    error: f.error,
    actions: { setSearch: s.setSearch, setStatusFilter: s.setStatusFilter, setTargetFilter: s.setTargetFilter, setPage: s.setPage },
  };
};
