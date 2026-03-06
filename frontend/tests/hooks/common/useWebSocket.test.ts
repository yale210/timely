import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useWebSocket, ConnectionStatusValues } from "@/hooks/common/useWebSocket";

describe("useWebSocket Hook", () => {
  let mockWebSocket: any;
  const mockUrl = "/ws/test";
  const mockOnMessage = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0, // CONNECTING
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;
    (global.WebSocket as any).OPEN = 1;
    (global.WebSocket as any).CLOSED = 3;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        host: 'localhost:3000',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does nothing if url is null", () => {
    const { result } = renderHook(() => useWebSocket(null, mockOnMessage));
    
    act(() => {
      vi.runAllTimers();
    });

    expect(global.WebSocket).not.toHaveBeenCalled();
    expect(result.current.status).toBe(ConnectionStatusValues.CLOSED);
  });

  it("establishes connection and sets status to CONNECTING", async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:3000/ws/test");
    expect(result.current.status).toBe(ConnectionStatusValues.CONNECTING);
  });

  it("sets status to OPEN when onopen is called", async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      mockWebSocket.onopen();
    });

    expect(result.current.status).toBe(ConnectionStatusValues.OPEN);
  });

  it("calls onMessage when valid JSON message is received", async () => {
    renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const testData = { foo: "bar" };
    act(() => {
      mockWebSocket.onmessage({ data: JSON.stringify(testData) });
    });

    expect(mockOnMessage).toHaveBeenCalledWith(testData);
  });

  it("ignores malformed JSON message", async () => {
    renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      mockWebSocket.onmessage({ data: "invalid json" });
    });

    expect(mockOnMessage).not.toHaveBeenCalled();
  });

  it("sets status to CLOSED and attempts reconnection on unclean close", async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      mockWebSocket.onopen();
    });

    expect(result.current.status).toBe(ConnectionStatusValues.OPEN);

    // Unclean close (code !== 1000)
    act(() => {
      mockWebSocket.onclose({ code: 1006 });
    });

    expect(result.current.status).toBe(ConnectionStatusValues.CLOSED);
    
    // Should attempt to reconnect after 1000ms
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });

  it("closes socket on error", async () => {
    renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      mockWebSocket.onerror();
    });

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    unmount();

    expect(mockWebSocket.close).toHaveBeenCalledWith(1000, 'Component unmounting');
  });

  it("sends message if socket is open", async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    mockWebSocket.readyState = 1; // OPEN
    const testMsg = { type: "ping" };
    
    act(() => {
      result.current.sendMessage(testMsg);
    });

    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMsg));
  });

  it("does not send message if socket is not open", async () => {
    const { result } = renderHook(() => useWebSocket(mockUrl, mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    mockWebSocket.readyState = 0; // CONNECTING
    
    act(() => {
      result.current.sendMessage({ type: "ping" });
    });

    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });

  it("uses wss: if protocol is https:", async () => {
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        host: 'example.com',
      },
      writable: true,
    });

    renderHook(() => useWebSocket("/ws/", mockOnMessage));
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(global.WebSocket).toHaveBeenCalledWith("wss://example.com/ws/");
  });
});
