import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  addVisibleUserIds,
  areAllVisibleUsersSelected,
  removeVisibleUserIds,
  toggleSelectedUserId,
} from "@/hooks/admin/notifications/useAdminBroadcastForm/broadcastUserSelection";
import { useBroadcastUsers } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastUsers";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getAdminUsers: vi.fn(),
}));

describe("useBroadcastUsers hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds and removes visible selections without losing other selected users", () => {
    expect(addVisibleUserIds([2, 4], [{ id: 1 }, { id: 2 }])).toEqual([2, 4, 1]);
    expect(removeVisibleUserIds([1, 2, 4], [{ id: 1 }, { id: 2 }])).toEqual([4]);
  });

  it("toggles individual user selection and derives visible selection state", () => {
    expect(toggleSelectedUserId([1], 1, true)).toEqual([1]);
    expect(toggleSelectedUserId([1], 2, true)).toEqual([1, 2]);
    expect(toggleSelectedUserId([1, 2], 1, false)).toEqual([2]);
    expect(areAllVisibleUsersSelected([{ id: 1 }, { id: 2 }], [2, 1, 3])).toBe(true);
    expect(areAllVisibleUsersSelected([{ id: 1 }, { id: 2 }], [1])).toBe(false);
    expect(areAllVisibleUsersSelected([], [1, 2])).toBe(false);
  });

  it("manages user selection and fetching", async () => {
    const mockData = {
      results: [{ id: 1, username: "user1" }],
      count: 1,
      next: null,
      previous: null,
    };
    (api.getAdminUsers as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const { result } = renderHook(() => useBroadcastUsers("users"));

    await waitFor(() => {
      expect(result.current.isUsersLoading).toBe(false);
    });

    expect(result.current.users).toEqual(mockData.results);
    expect(result.current.usersCount).toBe(1);
    expect(result.current.isUsersLoading).toBe(false);

    act(() => {
      result.current.toggleUserSelection(1, true);
    });
    expect(result.current.selectedUserIds).toEqual([1]);

    act(() => {
      result.current.toggleSelectAll(false);
    });
    expect(result.current.selectedUserIds).toEqual([]);
  });
});
