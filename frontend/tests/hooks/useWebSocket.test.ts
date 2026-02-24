import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket, ConnectionStatusValues } from '../../src/hooks/useWebSocket';

// Unmock the global mock from setupTests.ts
vi.unmock('../../src/hooks/useWebSocket');
vi.unmock('@/hooks/useWebSocket');

class MockWebSocket {
    static instances: MockWebSocket[] = [];
    url: string;
    readyState = 0;
    onopen: (() => void) | null = null;
    onclose: ((event: { code: number }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    send = vi.fn();
    close = vi.fn(function(this: MockWebSocket) {
        if (this.onclose) this.onclose({ code: 1000 });
    });

    // Provide WebSocket.OPEN constants
    static OPEN = 1;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('useWebSocket with unmock', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.instances = [];
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create a websocket and update status fully', () => {
        const onMessage = vi.fn();
        const { result } = renderHook(() => useWebSocket('/ws/test', onMessage));

        // Advance BOTH setTimeouts
        act(() => {
            vi.advanceTimersByTime(10);
        });

        expect(MockWebSocket.instances.length).toBe(1);
        const socket = MockWebSocket.instances[0];

        expect(result.current.status).toBe(ConnectionStatusValues.CONNECTING);

        act(() => {
            socket.readyState = 1; // OPEN
            if (socket.onopen) socket.onopen();
        });

        expect(result.current.status).toBe(ConnectionStatusValues.OPEN);

        // Test sending message
        act(() => {
            result.current.sendMessage({ test: 'data' });
        });
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ test: 'data' }));

        // Test receiving message
        act(() => {
            if (socket.onmessage) socket.onmessage({ data: JSON.stringify({ msg: 'hello' }) });
        });
        expect(onMessage).toHaveBeenCalledWith({ msg: 'hello' });

        // Test closing logic
        act(() => {
            if (socket.onclose) socket.onclose({ code: 1001 });
        });
        expect(result.current.status).toBe(ConnectionStatusValues.CLOSED);
        
        // Advance for reconnect (1s initially)
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        
        // Reconnection attempt check
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);
    });
});
