import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAdminHistoryState } from "@/hooks/admin/notifications/useAdminHistory";

describe("useAdminHistoryState hook", () => {
  it("manages history state", () => {
    const { result } = renderHook(() => useAdminHistoryState());
    expect(result.current.search).toBe("");
    
    act(() => {
      result.current.setSearch("test");
    });
    expect(result.current.search).toBe("test");
    expect(result.current.page).toBe(1);
  });
});
