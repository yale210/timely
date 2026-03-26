import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSharing } from "@/hooks/sharing/useSharing";

import * as shareService from "@/services/shareService";

vi.mock("@/services/shareService", () => ({
    getShares: vi.fn(),
    sendShare: vi.fn(),
    replyShare: vi.fn(),
}));

describe("useSharing", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
    vi.clearAllMocks();
  });

  it("fetches share count", async() => {
    const mockShareRequest = [{id: 1, name: "Test Share Request"}];
    vi.mocked(shareService.getShares).mockResolvedValue(mockShareRequest as any)
    const { result } = renderHook(() => useSharing());
    await waitFor(() => expect(result.current.shares).toEqual(mockShareRequest));

  });

  it("shares an event with another user", async() => {
    const mockShareRequest = [{id: 1, name: "Test Share Request"}];
    vi.mocked(shareService.sendShare).mockResolvedValue(mockShareRequest as any)
    vi.mocked(shareService.getShares).mockResolvedValue(mockShareRequest as any)
    const { result } = renderHook(() => useSharing());
    await act(async () => await result.current.shareEvent("e1", "2"));
    expect(shareService.sendShare).toHaveBeenCalledWith("e1", "2")

  });

  it("replies to a share event", async() => {
    const mockShareRequest = [{id: 1, name: "Test Share Request"}];
    vi.mocked(shareService.replyShare).mockResolvedValue(mockShareRequest as any)
    vi.mocked(shareService.getShares).mockResolvedValue(mockShareRequest as any)
    const { result } = renderHook(() => useSharing());
    await act(async () => await result.current.replyShare("e1", "accept", 2));
    expect(shareService.replyShare).toHaveBeenCalledWith("e1", "accept")

  });

  it("handle fetch share count error", async() => {
    vi.mocked(shareService.getShares).mockRejectedValue(new Error("errorErrorErrorError"))
    const { result } = renderHook(() => useSharing());
    await waitFor(() => expect(result.current.shareError).toBe("Failed to load shares."));

  });

  it("handle share event error", async() => {
    vi.mocked(shareService.sendShare).mockRejectedValue({ response: { data: { detail: "? Unkown Error",},},});
    const { result } = renderHook(() => useSharing());
   

    await act(async () => await result.current.shareEvent("e1", "2"));
    expect(result.current.shareError).toBe("? Unkown Error")

  });

   it("handle reply event error", async() => {
    vi.mocked(shareService.replyShare).mockRejectedValue({ response: { data: { detail: "Failed to reply to the share request.",},},});
    const { result } = renderHook(() => useSharing());
   

    await act(async () => await result.current.replyShare("e1", "accept", 2));
    expect(result.current.shareError).toBe("Failed to reply to the share request.")

  });

  it("handle share event error 2 -> instance of error is true", async() => {
    vi.mocked(shareService.sendShare).mockRejectedValue(new Error("Error :("));
    const { result } = renderHook(() => useSharing());
   

    await act(async () => await result.current.shareEvent("e1", "2"));
    expect(result.current.shareError).toBe("Error :(")

  });

  
});
