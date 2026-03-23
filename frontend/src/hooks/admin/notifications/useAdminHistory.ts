import { useMemo } from "react";
import { type BroadcastJobSummary } from "@/types";
import { useAdminHistoryState } from "./useAdminHistory/useAdminHistoryState";
import { useAdminHistoryFetch } from "./useAdminHistory/useAdminHistoryFetch";

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
