import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBroadcastFormEffects } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastFormEffects";

describe("useBroadcastFormEffects hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("debounces preview", () => {
    const setPreviewTitle = vi.fn();
    const setPreviewMessage = vi.fn();
    renderHook(() => useBroadcastFormEffects("T", "M", setPreviewTitle, setPreviewMessage));

    vi.advanceTimersByTime(200);
    expect(setPreviewTitle).toHaveBeenCalledWith("T");
  });
});
