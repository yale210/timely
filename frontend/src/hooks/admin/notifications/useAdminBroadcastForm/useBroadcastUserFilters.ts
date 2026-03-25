import { useCallback, useEffect, useReducer } from "react";
import { type AdminNotificationTarget, type AdminUserRole } from "@/types";

interface BroadcastUserFiltersState {
  search: string;
  roleFilter: AdminUserRole;
  usersPage: number;
}

type BroadcastUserFiltersAction =
  | { type: "setSearch"; value: string }
  | { type: "setRoleFilter"; value: AdminUserRole }
  | { type: "setUsersPage"; value: number }
  | { type: "resetPage" };

const initialBroadcastUserFiltersState: BroadcastUserFiltersState = {
  search: "",
  roleFilter: "all",
  usersPage: 1,
};

const broadcastUserFiltersReducer = (
  state: BroadcastUserFiltersState,
  action: BroadcastUserFiltersAction,
): BroadcastUserFiltersState => {
  if (action.type === "setSearch") return { ...state, search: action.value, usersPage: 1 };
  if (action.type === "setRoleFilter") return { ...state, roleFilter: action.value, usersPage: 1 };
  if (action.type === "setUsersPage") return { ...state, usersPage: action.value };
  return { ...state, usersPage: 1 };
};

/**
 * Stores user-search filters and paging state for the broadcast form.
 * @param _target - Active broadcast target used to reset paging on target changes.
 */
export const useBroadcastUserFilters = (_target: AdminNotificationTarget) => {
  const [state, dispatch] = useReducer(broadcastUserFiltersReducer, initialBroadcastUserFiltersState);

  const setSearch = useCallback((value: string) => { dispatch({ type: "setSearch", value }); }, []);
  const setRoleFilter = useCallback((value: AdminUserRole) => { dispatch({ type: "setRoleFilter", value }); }, []);
  const setUsersPage = useCallback((value: number) => { dispatch({ type: "setUsersPage", value }); }, []);

  useEffect(() => { dispatch({ type: "resetPage" }); }, [_target]);

  return { search: state.search, setSearch, roleFilter: state.roleFilter, setRoleFilter, usersPage: state.usersPage, setUsersPage };
}
