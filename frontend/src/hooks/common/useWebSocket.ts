import { useState, useEffect, useRef, useCallback } from "react";

/** The current state of the WebSocket connection. */
export type ConnectionStatus = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

/** The possible values for ConnectionStatus. */
export const ConnectionStatusValues = {
  CONNECTING: "CONNECTING" as ConnectionStatus,
  OPEN: "OPEN" as ConnectionStatus,
  CLOSING: "CLOSING" as ConnectionStatus,
  CLOSED: "CLOSED" as ConnectionStatus,
} as const;

/**
 * Constructs a full WebSocket URL from a relative path or partial URL.
 * @param u - The URL or path to convert.
 * @returns A fully qualified WebSocket URL.
 */
const buildUrl = (u: string) => {
  const p = window.location.protocol === "https:" ? "wss:" : "ws:";
  return u.startsWith("ws") ? u : `${p}//${window.location.host}${u}`;
};

/**
 * A custom hook to manage a WebSocket connection.
 * @param url - The URL of the WebSocket endpoint, or null if no connection should be made.
 * @param onMessage - Callback function invoked when a message is received from the server.
 * @returns An object containing the current connection status and a function to send messages.
 */
export const useWebSocket = (url: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatusValues.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const disposedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {
    // Initialised as a no-op to be populated by useEffect
  });

  const connect = useCallback(() => {
    if (!url || disposedRef.current) return;
    setStatus(ConnectionStatusValues.CONNECTING);
    const s = new WebSocket(buildUrl(url));
    socketRef.current = s;
    s.onopen = () => {
      if (!disposedRef.current) {
        setStatus(ConnectionStatusValues.OPEN);
        attemptsRef.current = 0;
      }
    };
    s.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data as string));
      } catch {
        /* ignore parsing errors */
      }
    };
    s.onerror = () => s.close();
    s.onclose = (e) => {
      if (disposedRef.current) return;
      setStatus(ConnectionStatusValues.CLOSED);
      socketRef.current = null;
      if (e.code !== 1000) {
        const t = Math.min(1000 * Math.pow(2, attemptsRef.current), 30000);
        timeoutRef.current = window.setTimeout(() => {
          attemptsRef.current += 1;
          connectRef.current();
        }, t);
      }
    };
  }, [url, onMessage]);

  useEffect(() => {
    connectRef.current = connect;
    disposedRef.current = false;
    const tId = setTimeout(connect, 0);
    return () => {
      disposedRef.current = true;
      clearTimeout(tId);
      socketRef.current?.close(1000, "Component unmounting");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [connect]);

  const send = useCallback((d: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(d));
    }
  }, []);

  return { status, sendMessage: send };
};
