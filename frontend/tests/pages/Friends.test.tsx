import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Friends from "@/pages/Friends";
import { useFriendships } from "@/hooks/friends/useFriendships";
import { authStore } from "@/services/authService";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/friends/useFriendships", () => ({
  useFriendships: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: vi.fn(),
  },
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({
    isOpen,
    title,
    confirmText = "Confirm",
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null
  ),
}));

describe("Friends page", () => {
  const mockSendRequest = vi.fn();
  const mockAcceptRequest = vi.fn();
  const mockDeclineRequest = vi.fn();
  const mockRemoveFriend = vi.fn();

  const acceptedFriendship = {
    id: 1,
    state: "ACCEPTED",
    sender: 1,
    receiver: 2,
    sender_username: "alice",
    sender_name: "Alice Example",
    sender_avatar: null,
    receiver_username_display: "bob",
    receiver_name: "Bob Example",
    receiver_avatar: null,
  } as any;

  const incomingFriendship = {
    id: 2,
    state: "SENT",
    sender: 3,
    receiver: 1,
    sender_username: "charlie",
    sender_name: "Charlie Example",
    sender_avatar: null,
    receiver_username_display: "alice",
    receiver_name: "Alice Example",
    receiver_avatar: null,
  } as any;

  const outgoingFriendship = {
    id: 3,
    state: "SENT",
    sender: 1,
    receiver: 4,
    sender_username: "alice",
    sender_name: "Alice Example",
    sender_avatar: null,
    receiver_username_display: "dana",
    receiver_name: "Dana Example",
    receiver_avatar: null,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore.getUser).mockReturnValue({ id: 1, username: "alice" } as any);
    vi.mocked(useFriendships).mockReturnValue({
      friendships: [acceptedFriendship, incomingFriendship, outgoingFriendship],
      loading: false,
      error: null,
      sending: false,
      actingIds: new Set(),
      refresh: vi.fn(),
      sendRequest: mockSendRequest,
      acceptRequest: mockAcceptRequest,
      declineRequest: mockDeclineRequest,
      removeFriend: mockRemoveFriend,
    });
  });

  it("sends friend requests and handles request actions", () => {
    render(
      <MemoryRouter>
        <Friends />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "eve" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    expect(mockSendRequest).toHaveBeenCalledWith("eve");

    fireEvent.click(screen.getByRole("button", { name: "Requests" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(mockAcceptRequest).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(mockDeclineRequest).toHaveBeenCalledWith(2);
  });

  it("confirms removing an existing friend", () => {
    render(
      <MemoryRouter>
        <Friends />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);

    expect(mockRemoveFriend).toHaveBeenCalledWith(1);
  });
});
