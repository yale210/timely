import { describe, expect, it } from "vitest";
import {
  addVisibleUserIds,
  areAllVisibleUsersSelected,
  removeVisibleUserIds,
  toggleSelectedUserId,
} from "@/hooks/admin/notifications/useAdminBroadcastUsers";

describe("broadcastUserSelection", () => {
  const users = [{ id: 1 }, { id: 2 }, { id: 3 }];

  describe("addVisibleUserIds", () => {
    it("adds all visible ids to the selection", () => {
      expect(addVisibleUserIds([10], users)).toEqual([10, 1, 2, 3]);
    });

    it("does not duplicate existing ids", () => {
      expect(addVisibleUserIds([2, 10], users)).toEqual([2, 10, 1, 3]);
    });
  });

  describe("removeVisibleUserIds", () => {
    it("removes all visible ids from the selection", () => {
      expect(removeVisibleUserIds([1, 2, 3, 4, 5], users)).toEqual([4, 5]);
    });

    it("leaves selection unchanged when no visible ids are selected", () => {
      expect(removeVisibleUserIds([4, 5], users)).toEqual([4, 5]);
    });
  });

  describe("toggleSelectedUserId", () => {
    it("adds a user id when shouldSelect is true and the id is not present", () => {
      expect(toggleSelectedUserId([1, 2], 3, true)).toEqual([1, 2, 3]);
    });

    it("does not duplicate a selected user id", () => {
      expect(toggleSelectedUserId([1, 2], 2, true)).toEqual([1, 2]);
    });

    it("removes a user id when shouldSelect is false", () => {
      expect(toggleSelectedUserId([1, 2, 3], 2, false)).toEqual([1, 3]);
    });
  });

  describe("areAllVisibleUsersSelected", () => {
    it("returns true when every visible user is selected", () => {
      expect(areAllVisibleUsersSelected(users, [1, 2, 3, 10])).toBe(true);
    });

    it("returns false when at least one visible user is missing", () => {
      expect(areAllVisibleUsersSelected(users, [1, 2])).toBe(false);
    });

    it("returns false when there are no visible users", () => {
      expect(areAllVisibleUsersSelected([], [1, 2, 3])).toBe(false);
    });
  });
});
