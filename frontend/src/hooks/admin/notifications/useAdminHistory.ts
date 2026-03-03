import { useEffect, useMemo, useState } from "react";
import { getBroadcastHistory } from "@/api/notifications";
import { type BroadcastJobSummary } from "@/types/notification";

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
 * Loads and filters admin notification broadcast history.
 * @returns History state, loading state, errors, and update actions.
 */
export const useAdminHistory = (): UseAdminHistoryReturn => { const [items, setItems] = useState<BroadcastJobSummary[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [targetFilter, setTargetFilter] = useState("");
const [page, setPage] = useState(1);
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
    } catch (historyError) {
      console.error("Failed to load broadcast history", historyError);
      setError("Failed to load broadcast history.");
    } finally {
      setLoading(false);
    }
  };

  void loadHistory();
}, [page, search, statusFilter, targetFilter]);

const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 50)), [count]);

return {
  state: {
    items,
    search,
    statusFilter,
    targetFilter,
    page,
    count,
    totalPages,
  },
  loading,
  error,
  actions: {
    setSearch: (value) => {
      setSearch(value);
      setPage(1);
    },
    setStatusFilter: (value) => {
      setStatusFilter(value);
      setPage(1);
    },
    setTargetFilter: (value) => {
      setTargetFilter(value);
      setPage(1);
    },
    setPage,
  },
}; };
