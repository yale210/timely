import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const swSource = readFileSync(
  resolve(process.cwd(), "public/sw.js"),
  "utf8",
);

type ServiceWorkerListener = (event: {
  data?: { json: () => unknown };
  notification?: { close: () => void; data?: { url?: string } };
  waitUntil: (promise: Promise<unknown>) => void;
}) => void;

function loadServiceWorker() {
  const listeners: Record<string, ServiceWorkerListener> = {};
  const selfMock = {
    addEventListener: vi.fn((type: string, handler: ServiceWorkerListener) => {
      listeners[type] = handler;
    }),
    registration: {
      showNotification: vi.fn().mockResolvedValue(undefined),
    },
    clients: {
      matchAll: vi.fn().mockResolvedValue([]),
      openWindow: vi.fn().mockResolvedValue(undefined),
    },
    location: {
      origin: "http://localhost:5173",
    },
  };

  runInNewContext(swSource, { self: selfMock, URL, console });

  return { selfMock, listeners };
}

describe("public/sw.js", () => {
  it("registers push and notificationclick listeners", () => {
    const { selfMock } = loadServiceWorker();

    expect(selfMock.addEventListener).toHaveBeenCalledWith("push", expect.any(Function));
    expect(selfMock.addEventListener).toHaveBeenCalledWith("notificationclick", expect.any(Function));
  });

  it("shows a notification when a push payload arrives", async () => {
    const { selfMock, listeners } = loadServiceWorker();
    const waitUntil = vi.fn();

    listeners.push({
      data: {
        json: () => ({
          title: "New message",
          message: "Hello",
          url: "/profile",
        }),
      },
      waitUntil,
    });

    expect(selfMock.registration.showNotification).toHaveBeenCalledWith(
      "New message",
      {
        body: "Hello",
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: {
          url: "/profile",
        },
      },
    );

    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    await waitUntil.mock.calls[0][0];
  });

  it("reuses an open client tab on notification click", async () => {
    const { selfMock, listeners } = loadServiceWorker();
    const focus = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn();
    const waitUntil = vi.fn();

    selfMock.clients.matchAll.mockResolvedValue([
      {
        url: "http://localhost:5173/dashboard",
        focus,
        navigate,
      },
    ]);

    listeners.notificationclick({
      notification: {
        close,
        data: { url: "/notifications" },
      },
      waitUntil,
    });

    expect(close).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    await waitUntil.mock.calls[0][0];

    expect(selfMock.clients.matchAll).toHaveBeenCalledWith({
      type: "window",
      includeUncontrolled: true,
    });
    expect(focus).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("http://localhost:5173/notifications");
  });

  it("opens a new window when there is no matching client", async () => {
    const { selfMock, listeners } = loadServiceWorker();
    const close = vi.fn();
    const waitUntil = vi.fn();

    selfMock.clients.matchAll.mockResolvedValue([]);

    listeners.notificationclick({
      notification: {
        close,
        data: {},
      },
      waitUntil,
    });

    expect(close).toHaveBeenCalledTimes(1);
    await waitUntil.mock.calls[0][0];

    expect(selfMock.clients.openWindow).toHaveBeenCalledWith(
      "http://localhost:5173/notifications",
    );
  });
});
