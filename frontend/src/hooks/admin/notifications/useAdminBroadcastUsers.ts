import { useCallback, useEffect, useReducer, useState } from "react";
import { getAdminUsers } from "@/api/notifications";
import {
  type AdminNotificationTarget,
  type AdminUserListResponse,
  type AdminUserRole,
  type AdminUserSummary,
} from "@/types";

type VisibleUser = Pick<AdminUserSummary, "id">;

/**
 * Adds all visible user IDs to the current selection.
 * @param selectedUserIds - Currently selected user IDs.
 * @param users - Users visible on the current page.
 */
export const addVisibleUserIds = (
  selectedUserIds: number[],
  users: VisibleUser[],
) => {
  const userIdSet = new Set(selectedUserIds);
  users.forEach((user) => userIdSet.add(user.id));
  return Array.from(userIdSet);
};

/**
 * Removes all visible user IDs from the current selection.
 * @param selectedUserIds - Currently selected user IDs.
 * @param users - Users visible on the current page.
 */
export const removeVisibleUserIds = (
  selectedUserIds: number[],
  users: VisibleUser[],
) => {
  const currentPageIds = new Set(users.map((user) => user.id));
  return selectedUserIds.filter((userId) => !currentPageIds.has(userId));
};

/**
 * Toggles one user ID within the current selection.
 * @param selectedUserIds - Currently selected user IDs.
 * @param userId - User ID to add or remove.
 * @param shouldSelect - Whether the user should be selected.
 */
export const toggleSelectedUserId = (
  selectedUserIds: number[],
  userId: number,
  shouldSelect: boolean,
) => {
  if (shouldSelect) {
    return selectedUserIds.includes(userId)
      ? selectedUserIds
      : [...selectedUserIds, userId];
  }
  return selectedUserIds.filter((selectedUserId) => selectedUserId !== userId);
};

/**
 * Reports whether every visible user is selected.
 * @param users - Users visible on the current page.
 * @param selectedUserIds - Currently selected user IDs.
 */
export const areAllVisibleUsersSelected = (
  users: VisibleUser[],
  selectedUserIds: number[],
) => users.length > 0 && users.every((user) => selectedUserIds.includes(user.id));

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
  if (action.type === "setSearch") {
    return { ...state, search: action.value, usersPage: 1 };
  }
  if (action.type === "setRoleFilter") {
    return { ...state, roleFilter: action.value, usersPage: 1 };
  }
  if (action.type === "setUsersPage") {
    return { ...state, usersPage: action.value };
  }
  return { ...state, usersPage: 1 };
};

/**
 * Stores user-search filters and paging state for the broadcast form.
 * @param _target - Active broadcast target used to reset paging on target changes.
 */
export const useBroadcastUserFilters = (_target: AdminNotificationTarget) => {
  const [state, dispatch] = useReducer(
    broadcastUserFiltersReducer,
    initialBroadcastUserFiltersState,
  );

  const setSearch = useCallback((value: string) => {
    dispatch({ type: "setSearch", value });
  }, []);
  const setRoleFilter = useCallback((value: AdminUserRole) => {
    dispatch({ type: "setRoleFilter", value });
  }, []);
  const setUsersPage = useCallback((value: number) => {
    dispatch({ type: "setUsersPage", value });
  }, []);

  useEffect(() => {
    dispatch({ type: "resetPage" });
  }, [_target]);

  return {
    search: state.search,
    setSearch,
    roleFilter: state.roleFilter,
    setRoleFilter,
    usersPage: state.usersPage,
    setUsersPage,
  };
};

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
  if (action.type === "reset") {
    return emptyUsersPageState;
  }
  if (action.type === "loading") {
    return { ...state, isUsersLoading: true, usersError: null };
  }
  if (action.type === "failure") {
    return {
      ...state,
      isUsersLoading: false,
      usersError: "Failed to load users.",
    };
  }
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
  const [state, dispatch] = useReducer(
    broadcastUsersPageReducer,
    emptyUsersPageState,
  );

  useEffect(() => {
    if (target !== "users") {
      dispatch({ type: "reset" });
      return;
    }
    let isActive = true;
    dispatch({ type: "loading" });
    void getAdminUsers({
      search,
      role: roleFilter,
      page: usersPage,
      pageSize: USERS_PAGE_SIZE,
    })
      .then((data) => {
        if (isActive) { dispatch({ type: "success", data }); }
      })
      .catch((error: unknown) => {
        console.error("Failed to load users", error);
        if (isActive) { dispatch({ type: "failure" }); }
      });
    return () => { isActive = false;};
  }, [roleFilter, search, target, usersPage]);

  return state;
};

/**
 * Hook to manage user selection and fetching for broadcast form.
 * @param target - The current notification target.
 * @returns User related state and actions.
 */
export const useBroadcastUsers = (target: AdminNotificationTarget) => {
  const filters = useBroadcastUserFilters(target);
  const usersPageState = useBroadcastUsersPage(
    target,
    filters.search,
    filters.roleFilter,
    filters.usersPage,
  );
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const toggleSelectAll = useCallback(
    (shouldSelect: boolean) => {
      setSelectedUserIds((previous) =>
        shouldSelect
          ? addVisibleUserIds(previous, usersPageState.users)
          : removeVisibleUserIds(previous, usersPageState.users),
      );
    },
    [usersPageState.users],
  );

  const toggleUserSelection = useCallback(
    (userId: number, shouldSelect: boolean) => {
      setSelectedUserIds((previous) =>
        toggleSelectedUserId(previous, userId, shouldSelect),
      );
    },
    [],
  );

  return {
    ...filters,
    ...usersPageState,
    selectedUserIds,
    setSelectedUserIds,
    isAllVisibleSelected: areAllVisibleUsersSelected(
      usersPageState.users,
      selectedUserIds,
    ),
    toggleSelectAll,
    toggleUserSelection,
  };
};
