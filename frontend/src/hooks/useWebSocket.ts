export * from "./common/useWebSocket";

// Compatibility shim: some tests and older imports expect hooks at the flat path
export { useWebSocket as default } from "./common/useWebSocket";
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Represents the possible states of a WebSocket connection.
 */
export type ConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export const ConnectionStatusValues = {
  CONNECTING: 'CONNECTING' as ConnectionStatus,
  OPEN: 'OPEN' as ConnectionStatus,
  CLOSING: 'CLOSING' as ConnectionStatus,
  CLOSED: 'CLOSED' as ConnectionStatus,
} as const;

/**
 * A custom hook to manage a WebSocket connection with automatic reconnection.
 *
 * Merges the best of both branches: robust URL handling, a disposedRef to avoid
 * setState after unmount, and a stable connectRef so reconnect timers call the
 * latest connect implementation.
 * @param url - WebSocket URL or path. Can be full ws:// or wss:// URL, protocol-relative (//host/path),
 *              absolute path (/path) or relative path (path). The hook will normalize to a full ws(s) URL.
 * @param onMessage - Callback invoked with parsed message data when a message is received.
 */
export const useWebSocket = (url: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatusValues.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(() => void) | null>(null);
  const disposedRef = useRef(false);

  const connect = useCallback(() => {
    if (!url) return;
    if (disposedRef.current) return;

    // Build a sensible full WebSocket URL:
    // - If caller provided a scheme (ws:// or wss:// or http/https), use as-is.
    // - If protocol-relative (//host/path), prefix with ws/wss.
    // - If path-absolute (/path) or relative (path), prefix with origin + ws/wss.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    let fullUrl: string;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
      fullUrl = url;
    } else if (url.startsWith('//')) {
      fullUrl = `${protocol}${url}`;
    } else if (url.startsWith('/')) {
      fullUrl = `${protocol}//${host}${url}`;
    } else {
      fullUrl = `${protocol}//${host}/${url}`;
    }

    try {
      setStatus(ConnectionStatusValues.CONNECTING);
      const socket = new WebSocket(fullUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (disposedRef.current) return;
        setStatus(ConnectionStatusValues.OPEN);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as unknown;
          onMessage(data);
        } catch {
          // ignore malformed messages
        }
      };

      socket.onclose = (event) => {
        if (disposedRef.current) return;
        setStatus(ConnectionStatusValues.CLOSED);
        socketRef.current = null;

        // If the close wasn't a normal close, attempt reconnect with backoff
        if (event.code !== 1000) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectRef.current?.();
          }, timeout);
        }
      };

      socket.onerror = () => {
        // Trigger close path which will schedule reconnect if needed
        try {
          socket.close();
        } catch {
          /* ignore */
        }
      };
    } catch (error) {
      // If constructing the socket throws, schedule a reconnect attempt
      console.error('WebSocket error', error);
      const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        connectRef.current?.();
      }, timeout);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    disposedRef.current = false;
    // Call connect asynchronously to avoid React strict-mode double-call issues
    const startTimeout = window.setTimeout(() => {
      connect();
    }, 0);

    return () => {
      disposedRef.current = true;
      clearTimeout(startTimeout);
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Component unmounting');
        } catch {
          /* ignore */
        }
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
      } catch {
        // ignore send errors
      }
    }
  }, []);

  return { status, sendMessage };
};
