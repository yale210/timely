import { useCallback, useEffect, useState } from "react";
import { getAdminUsers } from "@/api/notifications";
import {
  type AdminNotificationTarget,
  type AdminUserRole,
  type AdminUserSummary,
} from "@/types";

const USERS_PAGE_SIZE = 50;

/**
 * Hook to manage user selection and fetching for broadcast form.
 * @param target - The current notification target.
 * @returns User related state and actions.
 */
export const useBroadcastUsers = (target: AdminNotificationTarget) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole>("all");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersCount, setUsersCount] = useState(0);
  const [hasUsersNextPage, setHasUsersNextPage] = useState(false);
  const [hasUsersPreviousPage, setHasUsersPreviousPage] = useState(false);

  useEffect(() => {
    setUsersPage(1);
  }, [search, roleFilter, target]);

  useEffect(() => {
    if (target !== "users") {
      setUsers([]);
      setUsersCount(0);
      setHasUsersNextPage(false);
      setHasUsersPreviousPage(false);
      return;
    }

    const loadUsers = async () => {
      try {
        setIsUsersLoading(true);
        setUsersError(null);
        const data = await getAdminUsers({
          search,
          role: roleFilter,
          page: usersPage,
          pageSize: USERS_PAGE_SIZE,
        });
        setUsers(data.results);
        setUsersCount(data.count);
        setHasUsersNextPage(Boolean(data.next));
        setHasUsersPreviousPage(Boolean(data.previous));
      } catch (err) {
        console.error("Failed to load users", err);
        setUsersError("Failed to load users.");
      } finally {
        setIsUsersLoading(false);
      }
    };

    void loadUsers();
  }, [roleFilter, search, target, usersPage]);

  const toggleSelectAll = useCallback(
    (shouldSelect: boolean) => {
      if (shouldSelect) {
        setSelectedUserIds((prev) => {
          const userIdSet = new Set(prev);
          users.forEach((u) => userIdSet.add(u.id));
          return Array.from(userIdSet);
        });
      } else {
        const currentPageIds = new Set(users.map((u) => u.id));
        setSelectedUserIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
      }
    },
    [users],
  );

  const toggleUserSelection = useCallback((userId: number, shouldSelect: boolean) => {
    setSelectedUserIds((prev) => {
      if (shouldSelect) {
        return prev.includes(userId) ? prev : [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  }, []);

  const isAllVisibleSelected =
    users.length > 0 && users.every((user) => selectedUserIds.includes(user.id));

  return {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    users,
    selectedUserIds,
    setSelectedUserIds,
    isUsersLoading,
    usersError,
    usersPage,
    setUsersPage,
    usersCount,
    hasUsersNextPage,
    hasUsersPreviousPage,
    isAllVisibleSelected,
    toggleSelectAll,
    toggleUserSelection,
  };
};
