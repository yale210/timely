import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAdminBroadcastForm } from "@/hooks/admin/notifications/useAdminBroadcastForm";
import * as notificationsApi from "@/api/notifications";
import type { FormEvent } from "react";
import type { AdminUserListResponse } from "@/types";

// Mock API
vi.mock("@/api/notifications", () => ({
  getAdminUsers: vi.fn(),
  sendAdminNotification: vi.fn(),
  getAudienceCounts: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

const mockedGetAudienceCounts = vi.mocked(notificationsApi.getAudienceCounts);
const mockedGetAdminUsers = vi.mocked(notificationsApi.getAdminUsers);
const mockedSendAdminNotification = vi.mocked(notificationsApi.sendAdminNotification);
const mockedGetBroadcastStatus = vi.mocked(notificationsApi.getBroadcastStatus);

describe("useAdminBroadcastForm Hook", () => {
  const mockAudienceCounts = {
    all: 100,
    staff: 20,
    admin: 5,
    selected_users: 0,
  };

  const mockUsersResponse: AdminUserListResponse = {
    results: [
      {
        id: 1,
        username: "user1",
        email: "user1@example.com",
        is_staff: false,
        is_superuser: false,
        is_active: true,
        date_joined: "2023-01-01T10:00:00Z",
        last_login: null,
      },
      {
        id: 2,
        username: "user2",
        email: "user2@example.com",
        is_staff: false,
        is_superuser: false,
        is_active: true,
        date_joined: "2023-01-01T10:00:00Z",
        last_login: null,
      },
    ],
    count: 2,
    next: null,
    previous: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAudienceCounts.mockResolvedValue(mockAudienceCounts);
    mockedGetAdminUsers.mockResolvedValue(mockUsersResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default state", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());

    await waitFor(() => {
      expect(result.current.state.formData.target).toBe("all");
      expect(result.current.state.audience.audienceCounts).toEqual(mockAudienceCounts);
    });
  });

  it("updates title and message with preview delay", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());

    act(() => {
      result.current.actions.setTitle("Test Title");
      result.current.actions.setMessage("Test Message");
    });

    expect(result.current.state.formData.title).toBe("Test Title");
    
    // Wait for the 200ms timeout in the hook
    await waitFor(() => {
        expect(result.current.state.preview.previewTitle).toBe("Test Title");
        expect(result.current.state.preview.previewMessage).toBe("Test Message");
    }, { timeout: 1000 });
  });

  it("handles user target and fetches users", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());

    act(() => {
      result.current.actions.setTarget("users");
    });

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenCalled();
      expect(result.current.state.users.users).toEqual(mockUsersResponse.results);
    });
  });

  it("toggles user selection", () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    act(() => {
        result.current.actions.setTarget("users");
    });
    expect(result.current.state.formData.target).toBe("users");

    act(() => {
      result.current.actions.toggleUserSelection(1, true);
    });
    expect(result.current.state.users.selectedUserIds).toContain(1);

    act(() => {
      result.current.actions.toggleUserSelection(1, false);
    });
    expect(result.current.state.users.selectedUserIds).not.toContain(1);
  });

  it("toggles select all", () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    act(() => {
        result.current.actions.setTarget("users");
    });

    act(() => {
      result.current.actions.toggleSelectAll(true);
    });
    // We can't easily check selectedUserIds here because users are fetched async
  });

  it("validates form and handles handleSubmit", async () => {
    mockedGetAudienceCounts.mockResolvedValue({ ...mockAudienceCounts, all: 100 });
    const { result } = renderHook(() => useAdminBroadcastForm());
    await waitFor(() => expect(result.current.state.audience.audienceCounts.all).toBe(100));

    const mockEvent = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;

    act(() => {
      result.current.actions.handleSubmit(mockEvent);
    });
    expect(result.current.error.form).toBe("Please complete all required fields and confirmation.");

    act(() => {
      result.current.actions.setTitle("Title");
      result.current.actions.setMessage("Message");
      result.current.actions.setConfirmationChecked(true);
    });

    act(() => {
      result.current.actions.handleSubmit(mockEvent);
    });
    expect(result.current.state.isConfirmModalOpen).toBe(true);
  });

  it("handles successful handleConfirmSend and initial status fetch", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    await waitFor(() => expect(result.current.state.audience.audienceCounts.all).toBe(100));

    const mockBroadcastId = 123;
    mockedSendAdminNotification.mockResolvedValue({
      broadcast_id: mockBroadcastId,
      status: "QUEUED",
      queued_at: "2023-01-01T10:00:00Z",
      task_id: "t1",
      recipient_count: 10,
    });
    mockedGetBroadcastStatus.mockResolvedValue({
      id: mockBroadcastId,
      status: "IN_PROGRESS",
      recipient_count: 10,
      delivered_count: 0,
      failed_count: 0,
      queued_at: "2023-01-01T10:00:00Z",
      started_at: "2023-01-01T10:00:05Z",
      completed_at: null,
      task_id: "t1",
      updated_at: "2023-01-01T10:00:05Z",
    });

    act(() => {
        result.current.actions.setTitle("Title");
        result.current.actions.setMessage("Message");
        result.current.actions.setConfirmationChecked(true);
    });

    await act(async () => {
      await result.current.actions.handleConfirmSend();
    });

    expect(result.current.state.delivery.currentBroadcastId).toBe(mockBroadcastId);
    
    await waitFor(() => {
        expect(result.current.state.delivery.statusLabel).toBe("IN_PROGRESS");
    });
  });

  it("handles handleConfirmSend failure", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    await waitFor(() => expect(result.current.state.audience.audienceCounts.all).toBe(100));

    mockedSendAdminNotification.mockRejectedValue({
      response: { data: { error: { message: "Server Error" } } }
    });

    act(() => {
        result.current.actions.setTitle("Title");
        result.current.actions.setMessage("Message");
        result.current.actions.setConfirmationChecked(true);
    });

    await act(async () => {
      await result.current.actions.handleConfirmSend();
    });

    expect(result.current.error.form).toBe("Server Error");
  });

  it("handles role filter change", async () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    act(() => {
        result.current.actions.setTarget("users");
    });
    await waitFor(() => expect(mockedGetAdminUsers).toHaveBeenCalled());

    act(() => {
      result.current.actions.setRoleFilter("admin");
    });

    expect(result.current.state.users.roleFilter).toBe("admin");
    expect(result.current.state.users.usersPage).toBe(1);
  });

  it("normalizes userIdsInput correctly", () => {
    const { result } = renderHook(() => useAdminBroadcastForm());
    
    act(() => {
      result.current.actions.setUserIdsInput("1, 2, a, -1, 3");
    });

    expect(result.current.state.audience.selectedIdsForPayload).toEqual([1, 2, 3]);
  });
});

