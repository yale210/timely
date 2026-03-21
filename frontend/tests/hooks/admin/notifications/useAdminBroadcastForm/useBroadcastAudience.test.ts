import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBroadcastAudience } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastAudience";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getAudienceCounts: vi.fn(),
}));

describe("useBroadcastAudience hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates audience count", async () => {
    const mockCounts = { all: 10, staff: 2, admin: 1, selected_users: 0 };
    (api.getAudienceCounts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCounts);

    const { result } = renderHook(() => useBroadcastAudience("all", [], ""));

    await waitFor(() => {
      expect(result.current.targetAudienceCount).toBe(10);
    });

    expect(result.current.targetAudienceCount).toBe(10);
  });
});
