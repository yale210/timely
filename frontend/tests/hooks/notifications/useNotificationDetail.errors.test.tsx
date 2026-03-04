import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
describe("useNotificationDetail error branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets error when fetch fails", async () => {
    // mock api.get to reject
    vi.doMock("@/services/api", () => ({ default: { get: vi.fn().mockRejectedValue(new Error("fail")) } }));

    // provide a normal notification context
    vi.doMock("@/context/NotificationContext", () => ({
      useNotificationContext: () => ({
        markRead: vi.fn().mockResolvedValue(undefined),
        markUnread: vi.fn().mockResolvedValue(undefined),
        deleteNotification: vi.fn().mockResolvedValue(undefined),
        fetchNotifications: vi.fn().mockResolvedValue(undefined),
      }),
    }));

    // mock router params
    vi.doMock("react-router-dom", async () => {
      const actual = await vi.importActual<any>("react-router-dom");
      return {
        ...actual,
        useParams: () => ({ id: "999" }),
        useNavigate: () => vi.fn(),
      };
    });

    const { useNotificationDetail } = await import("@/hooks/notifications/useNotificationDetail");

    function Harness() {
      const { state, loading, error } = useNotificationDetail();
      return (
        <div>
          <div data-testid="loading">{String(loading)}</div>
          <div data-testid="error">{error ?? ""}</div>
          <div data-testid="message">{state.notification?.message ?? ""}</div>
        </div>
      );
    }

    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("error").textContent).toBe("Failed to fetch notification details");
  });

  it("logs error when toggle read fails", async () => {
    // Mock API get to return a notification
    vi.doMock("@/services/api", () => ({ default: { get: vi.fn().mockResolvedValue({ data: { id: 5, is_read: false, message: 'hi' } }) } }));

    // Mock notification context where markRead rejects
    const markRead = vi.fn().mockRejectedValue(new Error("toggle fail"));
    const fetchNotifications = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/context/NotificationContext", () => ({
      useNotificationContext: () => ({
        markRead,
        markUnread: vi.fn().mockResolvedValue(undefined),
        deleteNotification: vi.fn().mockResolvedValue(undefined),
        fetchNotifications,
      }),
    }));

    vi.doMock("react-router-dom", async () => {
      const actual = await vi.importActual<any>("react-router-dom");
      return {
        ...actual,
        useParams: () => ({ id: "5" }),
        useNavigate: () => vi.fn(),
      };
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { useNotificationDetail } = await import("@/hooks/notifications/useNotificationDetail");

    function Harness() {
      const { state, loading, error, actions } = useNotificationDetail();
      return (
        <div>
          <div data-testid="loading">{String(loading)}</div>
          <div data-testid="error">{error ?? ""}</div>
          <div data-testid="message">{state.notification?.message ?? ""}</div>
          <button data-testid="toggle" onClick={() => void actions.handleToggleRead()}>toggle</button>
        </div>
      );
    }

    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    // click toggle to trigger failing markRead
    screen.getByTestId("toggle").click();

    // expectation: console.error was called by the hook's catch
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
  });

  it("logs error when delete fails", async () => {
    vi.doMock("@/services/api", () => ({ default: { get: vi.fn().mockResolvedValue({ data: { id: 7, is_read: true, message: 'bye' } }) } }));

    const deleteNotification = vi.fn().mockRejectedValue(new Error("delete fail"));
    const fetchNotifications = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/context/NotificationContext", () => ({
      useNotificationContext: () => ({
        markRead: vi.fn().mockResolvedValue(undefined),
        markUnread: vi.fn().mockResolvedValue(undefined),
        deleteNotification,
        fetchNotifications,
      }),
    }));

    vi.doMock("react-router-dom", async () => {
      const actual = await vi.importActual<any>("react-router-dom");
      return {
        ...actual,
        useParams: () => ({ id: "7" }),
        useNavigate: () => vi.fn(),
      };
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { useNotificationDetail } = await import("@/hooks/notifications/useNotificationDetail");

    function Harness() {
      const { state, loading, error, actions } = useNotificationDetail();
      return (
        <div>
          <div data-testid="loading">{String(loading)}</div>
          <div data-testid="error">{error ?? ""}</div>
          <div data-testid="message">{state.notification?.message ?? ""}</div>
          <button data-testid="del" onClick={() => void actions.handleDelete()}>del</button>
        </div>
      );
    }

    render(<Harness />);

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    screen.getByTestId("del").click();

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
  });
});
