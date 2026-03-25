import { useCallback, useState } from "react";
import { type AdminNotificationTarget } from "@/types";
import {
  addVisibleUserIds,
  areAllVisibleUsersSelected,
  removeVisibleUserIds,
  toggleSelectedUserId,
} from "./broadcastUserSelection";
import { useBroadcastUserFilters } from "./useBroadcastUserFilters";
import { useBroadcastUsersPage } from "./useBroadcastUsersPage";

/**
 * Hook to manage user selection and fetching for broadcast form.
 * @param target - The current notification target.
 * @returns User related state and actions.
 */
export const useBroadcastUsers = (target: AdminNotificationTarget) => {
  const filters = useBroadcastUserFilters(target);
  const usersPageState = useBroadcastUsersPage(target, filters.search, filters.roleFilter, filters.usersPage);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const toggleSelectAll = useCallback(
    (shouldSelect: boolean) => {
      setSelectedUserIds((previous) => (
        shouldSelect
          ? addVisibleUserIds(previous, usersPageState.users)
          : removeVisibleUserIds(previous, usersPageState.users)
      ));
    },
    [usersPageState.users],
  );

  const toggleUserSelection = useCallback((userId: number, shouldSelect: boolean) => {
    setSelectedUserIds((previous) => toggleSelectedUserId(previous, userId, shouldSelect));
  }, []);

  return {
    ...filters,
    ...usersPageState,
    selectedUserIds,
    setSelectedUserIds,
    isAllVisibleSelected: areAllVisibleUsersSelected(usersPageState.users, selectedUserIds),
    toggleSelectAll,
    toggleUserSelection,
  };
};
