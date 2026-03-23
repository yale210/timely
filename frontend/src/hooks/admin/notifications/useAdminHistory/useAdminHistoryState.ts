import { useState } from "react";

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
    search, setSearch,
    statusFilter, setStatusFilter,
    targetFilter, setTargetFilter,
    page, setPage,
  };
};
