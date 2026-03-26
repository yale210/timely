import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Sharing from "@/pages/Sharing";
import { MemoryRouter } from "react-router-dom";
import { authStore } from "@/services/authService";
import { useSharing } from "@/hooks/sharing/useSharing";
import { getEvents } from "@/services/eventService";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: vi.fn(),
  },
}));

vi.mock("@/hooks/sharing/useSharing", () => ({
  useSharing: vi.fn(),
}));

vi.mock("@/services/eventService", () => ({
  getEvents: vi.fn(),
}));

describe("Sharing page", () => {
  const shareEvent = vi.fn();
  const replyShare = vi.fn();
  const fetchShares = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore.getUser).mockReturnValue({ id: 1, username: "alice" } as any);
    vi.mocked(useSharing).mockReturnValue({
      shares: [
        {
          id: 1,
          sender: 2,
          receiver: 1,
          sender_username: "bob",
          event_id: 7,
          event_title: "Shared event",
        },
        {
          id: 2,
          sender: 1,
          receiver: 3,
          receiver_username: "charlie",
          event_id: 8,
          event_title: "Outgoing event",
        },
      ],
      isSharesloading: false,
      isSharing: false,
      shareError: null,
      shareProcessing: null,
      shareEvent,
      replyShare,
      fetchShares,
    });
    vi.mocked(getEvents).mockResolvedValue([
      { id: 7, title: "Revision session" },
      { id: 7, title: "Revision session" },
    ] as any);
  });

  it("shares an event and loads the current event list", async () => {
    render(
      <MemoryRouter>
        <Sharing />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Revision session")).toBeDefined();

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "bob" } });
    fireEvent.change(inputs[1], { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Share Event" }));

    expect(shareEvent).toHaveBeenCalledWith("bob", "7");
  });

  it("loads share requests and forwards accept and decline actions", async () => {
    render(
      <MemoryRouter>
        <Sharing />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Share Requests" }));

    await waitFor(() => {
      expect(fetchShares).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(replyShare).toHaveBeenCalledWith("7", "accept", 1);

    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(replyShare).toHaveBeenCalledWith("7", "reject", 1);
  });
});
