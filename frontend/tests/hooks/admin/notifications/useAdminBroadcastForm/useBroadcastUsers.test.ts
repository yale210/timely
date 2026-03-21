import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBroadcastUsers } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastUsers";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getAdminUsers: vi.fn(),
}));

describe("useBroadcastUsers hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await act(async () => {
      // wait for effect to settle
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
