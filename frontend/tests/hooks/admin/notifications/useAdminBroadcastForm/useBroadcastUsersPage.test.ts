import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUsers } from "@/api/notifications";
import { useBroadcastUsersPage } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastUsersPage";
import type { AdminUserListResponse } from "@/types";

vi.mock("@/api/notifications", () => ({
  getAdminUsers: vi.fn(),
}));

const mockedGetAdminUsers = vi.mocked(getAdminUsers);

describe("useBroadcastUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the empty state when target is not users", () => {
    const { result } = renderHook(() =>
      useBroadcastUsersPage("all", "", "all", 1),
    );

    expect(result.current).toEqual({
      users: [],
      isUsersLoading: false,
      usersError: null,
      usersCount: 0,
      hasUsersNextPage: false,
      hasUsersPreviousPage: false,
    });

    expect(mockedGetAdminUsers).not.toHaveBeenCalled();
  });

  it("loads users successfully when target is users", async () => {
    const response: AdminUserListResponse = {
      count: 2,
      next: "/api/admin/users/?page=2",
      previous: null,
      results: [
        {
          id: 1,
          username: "alice",
          email: "alice@example.com",
          is_staff: false,
          is_superuser: false,
          is_active: true,
          date_joined: "2025-01-01T00:00:00Z",
          last_login: null,
        },
        {
          id: 2,
          username: "bob",
          email: "bob@example.com",
          is_staff: true,
          is_superuser: false,
          is_active: true,
          date_joined: "2025-01-02T00:00:00Z",
          last_login: "2025-01-03T00:00:00Z",
        },
      ],
    };

    mockedGetAdminUsers.mockResolvedValue(response);

    const { result } = renderHook(() =>
      useBroadcastUsersPage("users", "ali", "staff", 3),
    );

    expect(result.current.isUsersLoading).toBe(true);
    expect(result.current.usersError).toBeNull();

    await waitFor(() => {
      expect(result.current.isUsersLoading).toBe(false);
    });

    expect(mockedGetAdminUsers).toHaveBeenCalledWith({
      search: "ali",
      role: "staff",
      page: 3,
      pageSize: 50,
    });

    expect(result.current.users).toEqual(response.results);
    expect(result.current.usersCount).toBe(2);
    expect(result.current.hasUsersNextPage).toBe(true);
    expect(result.current.hasUsersPreviousPage).toBe(false);
    expect(result.current.usersError).toBeNull();
  });

  it("sets failure state when loading users fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetAdminUsers.mockRejectedValue(new Error("Request failed"));

    const { result } = renderHook(() =>
      useBroadcastUsersPage("users", "", "all", 1),
    );

    expect(result.current.isUsersLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isUsersLoading).toBe(false);
    });

    expect(result.current.usersError).toBe("Failed to load users.");
    expect(result.current.users).toEqual([]);
    expect(result.current.usersCount).toBe(0);
    expect(result.current.hasUsersNextPage).toBe(false);
    expect(result.current.hasUsersPreviousPage).toBe(false);

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("updates when dependencies change", async () => {
    mockedGetAdminUsers.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const { rerender } = renderHook(
      ({
        target,
        search,
        roleFilter,
        usersPage,
      }: {
        target: "all" | "staff" | "admin" | "users";
        search: string;
        roleFilter: "all" | "users" | "staff" | "admin";
        usersPage: number;
      }) => useBroadcastUsersPage(target, search, roleFilter, usersPage),
      {
        initialProps: {
          target: "users",
          search: "",
          roleFilter: "all",
          usersPage: 1,
        },
      },
    );

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenCalledTimes(1);
    });

    rerender({
      target: "users",
      search: "new query",
      roleFilter: "admin",
      usersPage: 2,
    });

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenCalledTimes(2);
    });

    expect(mockedGetAdminUsers).toHaveBeenLastCalledWith({
      search: "new query",
      role: "admin",
      page: 2,
      pageSize: 50,
    });
  });
});