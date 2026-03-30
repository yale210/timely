import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useBroadcastFormEffects } from "@/hooks/admin/notifications/useAdminBroadcastFormCore";

describe("useBroadcastFormEffects hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces preview", () => {
    const setPreviewTitle = vi.fn();
    const setPreviewMessage = vi.fn();
    renderHook(() => useBroadcastFormEffects("T", "M", setPreviewTitle, setPreviewMessage));

    vi.advanceTimersByTime(200);
    expect(setPreviewTitle).toHaveBeenCalledWith("T");
  });
});
