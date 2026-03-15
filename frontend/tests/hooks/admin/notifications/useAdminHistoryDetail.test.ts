import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAdminHistoryDetail } from "@/hooks/admin/notifications/useAdminHistoryDetail";
import { useParams } from "react-router-dom";
import {
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
} from "@/api/notifications";
import type { BroadcastJobDetail, BroadcastJobStatusResponse, RetryBroadcastResponse } from "@/types";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
}));

// Mock API
vi.mock("@/api/notifications", () => ({
  getBroadcastDetail: vi.fn(),
  getBroadcastStatus: vi.fn(),
  retryFailedBroadcast: vi.fn(),
}));

const mockedUseParams = vi.mocked(useParams);
const mockedGetBroadcastDetail = vi.mocked(getBroadcastDetail);
const mockedGetBroadcastStatus = vi.mocked(getBroadcastStatus);
const mockedRetryFailedBroadcast = vi.mocked(retryFailedBroadcast);

describe("useAdminHistoryDetail Hook", () => {
  const mockId = "1";
  const mockDetail: BroadcastJobDetail = {
    id: 1,
    title: "B1",
    message: "Msg",
    target: "all",
    status: "COMPLETED" as const,
    task_id: "t1",
    recipient_count: 2,
    delivered_count: 1,
    failed_count: 1,
    sender: 1,
    sender_username: "admin",
    audience_filters: {},
    audience_snapshot: {},
    provider_errors: [],
    queued_at: "2023-01-01T10:00:00Z",
    started_at: "2023-01-01T10:00:05Z",
    completed_at: "2023-01-01T10:10:00Z",
    retry_of: null,
    recipients: [
      { 
        id: 1, 
        recipient: 1,
        username: "u1",
        email: "u1@e.com",
        status: "SENT" as const,
        error_code: "",
        error_message: "",
        last_attempt_at: "2023-01-01T10:05:00Z",
        notification: 1
      },
      { 
        id: 2, 
        recipient: 2,
        username: "u2",
        email: "u2@e.com",
        status: "FAILED" as const,
        error_code: "500",
        error_message: "Error",
        last_attempt_at: "2023-01-01T10:05:00Z",
        notification: 2
      },
    ],
  };
  const mockStatus: BroadcastJobStatusResponse = {
    id: 1,
    status: "COMPLETED" as const,
    recipient_count: 2,
    delivered_count: 1,
    failed_count: 1,
    queued_at: "2023-01-01T10:00:00Z",
    started_at: "2023-01-01T10:00:05Z",
    completed_at: "2023-01-01T10:10:00Z",
    task_id: "t1",
    updated_at: "2023-01-01T10:10:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: mockId });
    mockedGetBroadcastDetail.mockResolvedValue(mockDetail);
    mockedGetBroadcastStatus.mockResolvedValue(mockStatus);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles invalid broadcast ID", async () => {
    mockedUseParams.mockReturnValue({ id: "invalid" });
    const { result } = renderHook(() => useAdminHistoryDetail());

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid broadcast ID.");
      expect(result.current.loading).toBe(false);
    });
  });

  it("fetches data on mount", async () => {
    const { result } = renderHook(() => useAdminHistoryDetail());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.state.detail).toEqual(mockDetail);
    expect(result.current.state.status).toEqual(mockStatus);
    expect(result.current.state.failedRecipientsCount).toBe(1);
  });

  it("sets error when initial fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* Silence console error */
    });
    mockedGetBroadcastDetail.mockRejectedValue(new Error("Fail"));

    const { result } = renderHook(() => useAdminHistoryDetail());

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to load broadcast detail.");
      expect(result.current.loading).toBe(false);
    });
    consoleSpy.mockRestore();
  });

  it("handles retry", async () => {
    const { result } = renderHook(() => useAdminHistoryDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedRetryFailedBroadcast.mockResolvedValue({ 
      broadcast_id: 1,
      status: "QUEUED",
      task_id: "t2",
      queued_at: "2023-01-01T11:00:00Z",
      recipient_count: 1
    } as RetryBroadcastResponse);
    const newDetail = { ...mockDetail, title: "Retried" };
    mockedGetBroadcastDetail.mockResolvedValue(newDetail);

    await act(async () => {
      await result.current.actions.handleRetry();
    });

    expect(mockedRetryFailedBroadcast).toHaveBeenCalledWith(1);
    expect(result.current.state.detail).toEqual(newDetail);
  });

  it("sets retryError on retry failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* Silence console error */
    });
    const { result } = renderHook(() => useAdminHistoryDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedRetryFailedBroadcast.mockRejectedValue(new Error("Retry Fail"));

    await act(async () => {
      await result.current.actions.handleRetry();
    });

    expect(result.current.retryError).toBe("Retry failed. Please try again.");
    consoleSpy.mockRestore();
  });

  it("updates retry confirmation modal state", async () => {
    const { result } = renderHook(() => useAdminHistoryDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    act(() => {
      result.current.actions.setRetryConfirmOpen(true);
    });
    expect(result.current.state.isRetryConfirmOpen).toBe(true);

    act(() => {
      result.current.actions.setRetryConfirmOpen(false);
    });
    expect(result.current.state.isRetryConfirmOpen).toBe(false);
  });

  it("polls for status when in non-terminal state", async () => {
    vi.useFakeTimers();
    mockedGetBroadcastStatus.mockResolvedValue({ ...mockStatus, status: "QUEUED" });
    
    const { result } = renderHook(() => useAdminHistoryDetail());
    // Use vi.waitFor instead of testing-library waitFor when using fake timers
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.state.status?.status).toBe("QUEUED");

    // Advance timer to trigger polling
    mockedGetBroadcastStatus.mockResolvedValue({ ...mockStatus, status: "COMPLETED" });
    await vi.advanceTimersByTimeAsync(3000);

    await vi.waitFor(() => {
      expect(result.current.state.status?.status).toBe("COMPLETED");
    });
  });

  it("handles polling error", async () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* Silence */ });
    mockedGetBroadcastStatus.mockResolvedValue({ ...mockStatus, status: "QUEUED" });
    
    const { result } = renderHook(() => useAdminHistoryDetail());
    
    // Wait for initial load to finish so status is set and loading is false
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.state.status?.status).toBe("QUEUED");

    mockedGetBroadcastStatus.mockRejectedValue(new Error("Polling failed"));
    
    // Advance enough time to trigger the interval
    await vi.advanceTimersByTimeAsync(3000);

    await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});

