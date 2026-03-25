import { useEffect, useReducer } from "react";
import { getAdminUsers } from "@/api/notifications";
import {
  type AdminNotificationTarget,
  type AdminUserListResponse,
  type AdminUserRole,
  type AdminUserSummary,
} from "@/types";

interface BroadcastUsersPageState {
  users: AdminUserSummary[];
  isUsersLoading: boolean;
  usersError: string | null;
  usersCount: number;
  hasUsersNextPage: boolean;
  hasUsersPreviousPage: boolean;
}

type BroadcastUsersPageAction =
  | { type: "reset" }
  | { type: "loading" }
  | { type: "success"; data: AdminUserListResponse }
  | { type: "failure" };

const USERS_PAGE_SIZE = 50;

const emptyUsersPageState: BroadcastUsersPageState = {
  users: [],
  isUsersLoading: false,
  usersError: null,
  usersCount: 0,
  hasUsersNextPage: false,
  hasUsersPreviousPage: false,
};

const broadcastUsersPageReducer = (
  state: BroadcastUsersPageState,
  action: BroadcastUsersPageAction,
): BroadcastUsersPageState => {
  if (action.type === "reset") return emptyUsersPageState;
  if (action.type === "loading") return { ...state, isUsersLoading: true, usersError: null };
  if (action.type === "failure") return { ...state, isUsersLoading: false, usersError: "Failed to load users." };
  return {
    users: action.data.results,
    isUsersLoading: false,
    usersError: null,
    usersCount: action.data.count,
    hasUsersNextPage: Boolean(action.data.next),
    hasUsersPreviousPage: Boolean(action.data.previous),
  };
};

/**
 * Loads one page of admin users for the broadcast recipient picker.
 * @param target - Active broadcast target.
 * @param search - Current user search query.
 * @param roleFilter - Current role filter.
 * @param usersPage - Current page number.
 */
export const useBroadcastUsersPage = (
  target: AdminNotificationTarget,
  search: string,
  roleFilter: AdminUserRole,
  usersPage: number,
) => {
  const [state, dispatch] = useReducer(broadcastUsersPageReducer, emptyUsersPageState);

  useEffect(() => {
    if (target !== "users") {
      dispatch({ type: "reset" });
      return;
    }
    let isActive = true;
    dispatch({ type: "loading" });
    void getAdminUsers({ search, role: roleFilter, page: usersPage, pageSize: USERS_PAGE_SIZE })
      .then((data) => { if (isActive) dispatch({ type: "success", data }); })
      .catch((error: unknown) => {
        console.error("Failed to load users", error);
        if (isActive) dispatch({ type: "failure" });
      });
    return () => { isActive = false; };
  }, [roleFilter, search, target, usersPage]);

  return state;
};
