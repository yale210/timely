import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket, ConnectionStatusValues } from '@/hooks/common/useWebSocket';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(function (this: MockWebSocket) {
    if (this.onclose) this.onclose({ code: 1000 });
  });

  static OPEN = 1;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

describe('common/useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects, sends, receives, handles close and reconnects, and cleans up', () => {
    const onMessage = vi.fn();
    const { result, unmount } = renderHook(() => useWebSocket('/ws/test', onMessage));

    // Trigger async connect scheduled with setTimeout
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(MockWebSocket.instances.length).toBe(1);
    const socket = MockWebSocket.instances[0];

    // Initially CONNECTING
    expect(result.current.status).toBe(ConnectionStatusValues.CONNECTING);

    // Simulate open
    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      if (socket.onopen) socket.onopen();
    });
    expect(result.current.status).toBe(ConnectionStatusValues.OPEN);

    // sendMessage should call socket.send with JSON
    act(() => result.current.sendMessage({ hello: 'world' }));
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ hello: 'world' }));

    // incoming valid message
    act(() => {
      if (socket.onmessage) socket.onmessage({ data: JSON.stringify({ ok: true }) });
    });
    expect(onMessage).toHaveBeenCalledWith({ ok: true });

    // incoming malformed message should be ignored (no throw)
    act(() => {
      if (socket.onmessage) socket.onmessage({ data: 'not-json' });
    });

    // simulate abnormal close to trigger reconnect
    act(() => {
      if (socket.onclose) socket.onclose({ code: 1001 });
    });
    expect(result.current.status).toBe(ConnectionStatusValues.CLOSED);

    // advance timers to allow reconnect attempts
    act(() => vi.advanceTimersByTime(2000));
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);

    // unmount should clean up and close sockets
    unmount();
    // ensure close called on the last instance if present
    const last = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    if (last) {
      expect(last.close).toHaveBeenCalled();
    }
  });
});
