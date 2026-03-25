import { type AdminUserSummary } from "@/types";

type VisibleUser = Pick<AdminUserSummary, "id">;

/**
 * Adds all visible user IDs to the current selection.
 * @param selectedUserIds - Currently selected user IDs.
 * @param users - Users visible on the current page.
 */
export const addVisibleUserIds = (selectedUserIds: number[], users: VisibleUser[]) => {
  const userIdSet = new Set(selectedUserIds);
  users.forEach((user) => userIdSet.add(user.id));
  return Array.from(userIdSet);
};

/**
 * Removes all visible user IDs from the current selection.
 * @param selectedUserIds - Currently selected user IDs.
 * @param users - Users visible on the current page.
 */
export const removeVisibleUserIds = (selectedUserIds: number[], users: VisibleUser[]) => {
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
    return selectedUserIds.includes(userId) ? selectedUserIds : [...selectedUserIds, userId];
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
