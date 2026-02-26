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
 * This hook establishes a WebSocket connection, monitors its status,
 * and handles incoming messages. It also includes exponential backoff
 * for reconnection attempts when the connection is lost.
 * @param url - The WebSocket endpoint URL. If null, the connection is not attempted.
 * @param onMessage - A callback function to handle incoming WebSocket messages.
 * @returns An object containing the current connection status and the message history.
 */
export const useWebSocket = (url: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatusValues.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<() => void>(undefined);

  const connect = useCallback(() => {
    if (!url) {
      return;
    }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;

      // Construct the websocket URL intelligently:
      // - If caller passed an absolute URL (has a scheme like ws://, wss://, http://, https://), use it as-is.
      // - If it's protocol-relative (//example.com/path), prefix the ws/wss scheme.
      // - If it's an absolute path (/path), prefix with the current origin and ws/wss scheme.
      // - Otherwise treat as a relative path and prefix with origin + leading '/'.
      let fullUrl: string;
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
        // absolute URL with scheme
        fullUrl = url;
      } else if (url.startsWith('//')) {
        // protocol-relative (//host/path)
        fullUrl = `${protocol}${url}`;
      } else if (url.startsWith('/')) {
        // path-absolute
        fullUrl = `${protocol}//${host}${url}`;
      } else {
        // relative path without leading slash
        fullUrl = `${protocol}//${host}/${url}`;
      }

    try {
      setStatus(ConnectionStatusValues.CONNECTING);
      const socket = new WebSocket(fullUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus(ConnectionStatusValues.OPEN);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as unknown;
          onMessage(data);
        } catch {
          // silent: malformed messages are ignored
        }
      };

      socket.onclose = (event) => {
        setStatus(ConnectionStatusValues.CLOSED);
        socketRef.current = null;

        if (event.code !== 1000) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connectRef.current?.();
          }, timeout);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket error', error);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    // Calling connect asynchronously to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      connect();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, sendMessage };
};
