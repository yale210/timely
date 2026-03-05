import { vi, afterEach, expect as vitestExpect } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import type * as authServiceModule from "@/services/authService";

// Ensure the DOM is cleaned between tests (Vitest + Testing Library)
afterEach(() => cleanup());

// Some tests import the non-vitest build of jest-dom which expects a global
// `expect` to exist during module evaluation. Ensure it is available.
declare global {
  // Provide the vitest expect globally for modules that expect `expect` during
  // module evaluation (some jest-dom builds do this). Keep the type strict.
  var expect: typeof vitestExpect;
}

// Use nullish coalescing to avoid overriding an existing global expect.
globalThis.expect = globalThis.expect ?? vitestExpect;

interface RechartsProps {
  children?: React.ReactNode;
}

vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  const ResponsiveContainer: React.FC<RechartsProps> = ({ children }) => {
    const maybeChild = React.Children.toArray(children)[0];
    const style = { width: 800, height: 600 };
    if (!React.isValidElement(maybeChild)) return React.createElement("div", { style });
    return React.cloneElement(maybeChild, { ...(maybeChild.props ?? {}), ...style });
  };
  return { ...original, ResponsiveContainer };
});

// Fix for headless UI and other components expecting window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global mock for notification context to prevent every test needing to wrap in NotificationProvider
vi.mock("@/context/NotificationContext", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
  useNotificationContext: vi.fn(() => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    fetchNotifications: vi.fn(),
    fetchUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markUnread: vi.fn(),
    markAllRead: vi.fn(),
    deleteNotification: vi.fn(),
    deleteAllNotifications: vi.fn(),
  })),
}));

// Global mock for auth store to avoid network calls and provide default auth state
vi.mock("@/services/authService", async (importActual) => {
  const actual = await importActual<typeof authServiceModule>();
  return {
    ...actual,
    authStore: {
      ...actual.authStore,
      getUser: vi.fn().mockReturnValue(null),
      getToken: vi.fn().mockReturnValue(null),
      isAdmin: vi.fn().mockReturnValue(false),
      isAuthenticated: vi.fn().mockReturnValue(false),
    },
    authService: {
      logout: vi.fn().mockResolvedValue({}),
      login: vi.fn().mockResolvedValue({ token: "fake-token" }),
    },
  };
});

// Global mock for useWebSocket to prevent actual socket connection attempts and handle 'window' access in JSDOM
vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: vi.fn().mockReturnValue({
    status: "CLOSED",
    history: [],
    sendMessage: vi.fn(),
  }),
  ConnectionStatusValues: {
    CONNECTING: "CONNECTING",
    OPEN: "OPEN",
    CLOSING: "CLOSING",
    CLOSED: "CLOSED",
  },
}));
