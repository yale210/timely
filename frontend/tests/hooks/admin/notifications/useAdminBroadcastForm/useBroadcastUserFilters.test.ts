import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBroadcastUserFilters } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastUserFilters";

describe("useBroadcastUserFilters", () => {
  it("starts with the default state", () => {
    const { result } = renderHook(() => useBroadcastUserFilters("all"));

    expect(result.current.search).toBe("");
    expect(result.current.roleFilter).toBe("all");
    expect(result.current.usersPage).toBe(1);
  });

  it("setSearch updates search and resets the page to 1", () => {
    const { result } = renderHook(() => useBroadcastUserFilters("all"));

    act(() => {
      result.current.setUsersPage(4);
    });
    expect(result.current.usersPage).toBe(4);

    act(() => {
      result.current.setSearch("Asuka");
    });

    expect(result.current.search).toBe("Asuka");
    expect(result.current.usersPage).toBe(1);
  });

  it("setRoleFilter updates the role and resets the page to 1", () => {
    const { result } = renderHook(() => useBroadcastUserFilters("all"));

    act(() => {
      result.current.setUsersPage(3);
    });
    expect(result.current.usersPage).toBe(3);

    act(() => {
      result.current.setRoleFilter("staff");
    });

    expect(result.current.roleFilter).toBe("staff");
    expect(result.current.usersPage).toBe(1);
  });

  it("setUsersPage updates the page", () => {
    const { result } = renderHook(() => useBroadcastUserFilters("all"));

    act(() => {
      result.current.setUsersPage(5);
    });

    expect(result.current.usersPage).toBe(5);
  });

  it("resets the page when the target changes", () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: "all" | "staff" | "admin" | "users" }) =>
        useBroadcastUserFilters(target),
      {
        initialProps: { target: "all" },
      },
    );

    act(() => {
      result.current.setUsersPage(6);
    });

    expect(result.current.usersPage).toBe(6);

    rerender({ target: "users" });

    expect(result.current.usersPage).toBe(1);
  });
});