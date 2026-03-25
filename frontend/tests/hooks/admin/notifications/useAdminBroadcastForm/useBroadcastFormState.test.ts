import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useBroadcastFormState } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastFormState";

describe("useBroadcastFormState hook", () => {
  it("initializes state", () => {
    const { result } = renderHook(() => useBroadcastFormState());
    expect(result.current.title).toBe("");
    expect(result.current.target).toBe("all");
  });
});
