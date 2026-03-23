import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useBroadcastValidation } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastValidation";

describe("useBroadcastValidation hook", () => {
  it("validates broadcast data", () => {
    const { result } = renderHook(() => useBroadcastValidation("Title", "Message", "all", 10, true));
    expect(result.current.canSubmit).toBe(true);
  });
});
