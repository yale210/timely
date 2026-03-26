import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Sharing from "@/pages/Sharing";
import { MemoryRouter } from "react-router-dom";
import { useSharing } from "@/hooks/sharing/useSharing";
import { getEvents } from "@/services/eventService";
import type { Event, Share, User } from "@/types";

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: mockGetUser,
  },
}));

vi.mock("@/hooks/sharing/useSharing", () => ({
  useSharing: vi.fn(),
}));

vi.mock("@/services/eventService", () => ({
  getEvents: vi.fn(),
}));

describe("Sharing page", () => {
  type UseSharingResult = ReturnType<typeof useSharing>;

  const shareEvent = vi.fn();
  const replyShare = vi.fn();
  const fetchShares = vi.fn(() => Promise.resolve(undefined));

  const buildEvent = (overrides: Partial<Event> = {}): Event => ({
    id: 7,
    title: "Revision session",
    start_time: "2099-01-01T10:00:00Z",
    end_time: "2099-01-01T11:00:00Z",
    categories: [],
    reminders: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    const currentUser: User = { id: 1, username: "alice", email: "alice@example.com" };
    mockGetUser.mockReturnValue(currentUser);
    const sharingState: UseSharingResult = {
      shares: [
        {
          id: 1,
          sender: 2,
          receiver: 1,
          sender_username: "bob",
          receiver_username: "alice",
          event_id: 7,
          event_title: "Shared event",
        } satisfies Share,
        {
          id: 2,
          sender: 1,
          receiver: 3,
          sender_username: "alice",
          receiver_username: "charlie",
          event_id: 8,
          event_title: "Outgoing event",
        } satisfies Share,
      ],
      isSharesloading: false,
      isSharing: false,
      shareError: null,
      shareProcessing: null,
      shareEvent,
      replyShare,
      fetchShares,
    };
    vi.mocked(useSharing).mockReturnValue(sharingState);
    vi.mocked(getEvents).mockResolvedValue([
      buildEvent(),
      buildEvent(),
    ]);
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
