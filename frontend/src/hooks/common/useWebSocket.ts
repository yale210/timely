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
  const disposedRef = useRef(false);
  const connect = useCallback(() => {
    if (!url) return;

    if (disposedRef.current) return;
    setStatus(ConnectionStatusValues.CONNECTING);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const fullUrl = url.startsWith('ws') ? url : `${protocol}//${host}${url}`;

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
        // silent: malformed messages are ignored
      }
    };

    socket.onclose = (event) => {
      if (disposedRef.current) return;
      setStatus(ConnectionStatusValues.CLOSED);
      socketRef.current = null;

      if (event.code !== 1000) {
        // Reconnect with exponential backoff for unexpected disconnects, but not for intentional closes.
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
  }, [url, onMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    disposedRef.current = false;
    // Defer the initial connect so the effect does not synchronously set state during mount.
    const timeoutId = setTimeout(() => {
      connect();
    }, 0);

    return () => {
      disposedRef.current = true;
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
