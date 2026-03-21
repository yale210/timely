import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAdminHistoryFetch } from "@/hooks/admin/notifications/useAdminHistory/useAdminHistoryFetch";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getBroadcastHistory: vi.fn(),
}));

describe("useAdminHistoryFetch hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches history", () => {
    (api.getBroadcastHistory as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [], count: 0 });
    renderHook(() => useAdminHistoryFetch(1, "", "", ""));
    expect(api.getBroadcastHistory).toHaveBeenCalled();
  });
});
