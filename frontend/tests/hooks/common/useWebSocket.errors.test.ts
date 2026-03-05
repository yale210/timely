import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises */
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "@/hooks/common/useWebSocket";

describe("useWebSocket error and edge branches", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ensure no leftover global stub
    try {
      vi.unstubAllGlobals();
    } catch {
      /* ignore */
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // reset counters if used
    ;(global as any).FlakyWebSocket = undefined;
  });

  it("does not send when socket is not OPEN (no-op branch)", () => {
    class MockWS {
      static instances: MockWS[] = [];
      url: string;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onclose: ((ev: { code: number }) => void) | null = null;
      onerror: (() => void) | null = null;
      send = vi.fn();
      close = vi.fn();
      static OPEN = 1;
      constructor(url: string) {
        this.url = url;
        MockWS.instances.push(this);
      }
    }

    vi.stubGlobal("WebSocket", MockWS as any);

    const onMessage = vi.fn();
    const hook = renderHook(() => useWebSocket("/ws/test", onMessage));

    // allow the async connect scheduled with setTimeout to run
    act(() => vi.advanceTimersByTime(10));

    const socket = (MockWS.instances[0] as any) as MockWS;
    expect(socket).toBeTruthy();

    // At this point readyState is 0 (CONNECTING), sendMessage should be no-op
    act(() => hook.result.current.sendMessage({ foo: "bar" }));
    expect(socket.send).not.toHaveBeenCalled();
  });

  it("handles socket.onerror by closing and scheduling reconnect", () => {
    class MockWS2 {
      static instances: MockWS2[] = [];
      url: string;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onclose: ((ev: { code: number }) => void) | null = null;
      onerror: (() => void) | null = null;
      send = vi.fn();
      close = vi.fn(function (this: MockWS2) {
        if (this.onclose) this.onclose({ code: 1001 });
      });
      static OPEN = 1;
      constructor(url: string) {
        this.url = url;
        MockWS2.instances.push(this);
      }
    }

    vi.stubGlobal("WebSocket", MockWS2 as any);

    const onMessage = vi.fn();
    renderHook(() => useWebSocket("/ws/test", onMessage));

    act(() => vi.advanceTimersByTime(10));

    const socket = MockWS2.instances[0];
    expect(socket).toBeTruthy();

    // Simulate an error which should call close and then cause a reconnect
    act(() => {
      if (socket.onerror) socket.onerror();
      // onerror should call close() internally
    });

    expect(socket.close).toHaveBeenCalled();

    // advance timers to allow reconnect scheduled by the hook
    act(() => vi.advanceTimersByTime(2000));
    expect(MockWS2.instances.length).toBeGreaterThanOrEqual(2);
  });

  it("schedules a reconnect when constructor throws on first attempt", () => {
    // Flaky constructor: throws on first attempt, succeeds on second
    class FlakyWS {
      static attempts = 0;
      static instances: FlakyWS[] = [];
      url: string;
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onclose: ((ev: { code: number }) => void) | null = null;
      onerror: (() => void) | null = null;
      send = vi.fn();
      close = vi.fn(function (this: FlakyWS) {
        if (this.onclose) this.onclose({ code: 1000 });
      });
      static OPEN = 1;
      constructor(url: string) {
        FlakyWS.attempts += 1;
        if (FlakyWS.attempts === 1) {
          throw new Error("boom");
        }
        this.url = url;
        FlakyWS.instances.push(this);
      }
    }

    vi.stubGlobal("WebSocket", FlakyWS as any);

    const onMessage = vi.fn();
    renderHook(() => useWebSocket("/ws/flaky", onMessage));

    // advance a bit to let the initial connect (which throws) schedule a reconnect
    act(() => vi.advanceTimersByTime(50));

    // advance timers enough for the reconnect backoff to execute
    act(() => vi.advanceTimersByTime(2000));

    // After reconnect, at least one successful instance should exist
    expect(FlakyWS.instances.length).toBeGreaterThanOrEqual(1);
  });
});
