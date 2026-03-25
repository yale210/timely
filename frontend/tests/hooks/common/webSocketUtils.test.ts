import { describe, expect, it, vi } from "vitest";
import {
  buildWebSocketUrl,
  getReconnectDelay,
  handleWebSocketMessage,
} from "@/hooks/common/webSocketUtils";

describe("webSocketUtils", () => {
  it("builds a websocket URL from a relative path", () => {
    Object.defineProperty(window, "location", {
      value: { protocol: "https:", host: "timely.test" },
      writable: true,
    });

    expect(buildWebSocketUrl("/ws/notifications/")).toBe("wss://timely.test/ws/notifications/");
  });

  it("caps reconnect delay at thirty seconds", () => {
    expect(getReconnectDelay(0)).toBe(1000);
    expect(getReconnectDelay(10)).toBe(30000);
  });

  it("ignores malformed message payloads", () => {
    const onMessage = vi.fn();

    handleWebSocketMessage("not-json", onMessage);

    expect(onMessage).not.toHaveBeenCalled();
  });
});
