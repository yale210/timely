import { useState, useEffect, useRef, useCallback } from "react";
import { buildWebSocketUrl, getReconnectDelay, handleWebSocketMessage } from "@/hooks/common/webSocketUtils";

/** The supported WebSocket connection states. */
export type ConnectionStatus = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

/** Available WebSocket connection status values. */
export const ConnectionStatusValues = {
  CONNECTING: "CONNECTING" as ConnectionStatus,
  OPEN: "OPEN" as ConnectionStatus,
  CLOSING: "CLOSING" as ConnectionStatus,
  CLOSED: "CLOSED" as ConnectionStatus,
} as const;

const attachSocketListeners = (
  socket: WebSocket,
  onMessage: (data: unknown) => void,
  disposedRef: React.MutableRefObject<boolean>,
  socketRef: React.MutableRefObject<WebSocket | null>,
  attemptsRef: React.MutableRefObject<number>,
  setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>,
  scheduleReconnect: () => void,
) => {
  socket.onopen = () => {
    if (!disposedRef.current) {
      setStatus(ConnectionStatusValues.OPEN);
      attemptsRef.current = 0;
    }
  };
  socket.onmessage = (event) => { handleWebSocketMessage(event.data as string, onMessage); };
  socket.onerror = () => { socket.close(); };
  socket.onclose = (event) => {
    if (disposedRef.current) return;
    setStatus(ConnectionStatusValues.CLOSED);
    socketRef.current = null;
    if (event.code !== 1000) scheduleReconnect();
  };
};

const closeSocket = (socketRef: React.MutableRefObject<WebSocket | null>, timeoutRef: React.MutableRefObject<number | null>) => {
  socketRef.current?.close(1000, "Component unmounting");
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
};

const sendJsonMessage = (socketRef: React.MutableRefObject<WebSocket | null>, data: unknown) => {
  if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(data));
};

/**
 * Manages a WebSocket connection with reconnection and JSON message parsing.
 * @param url - The WebSocket endpoint or null when disconnected.
 * @param onMessage - Called with parsed message payloads.
 */
export const useWebSocket = (url: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatusValues.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const disposedRef = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);

  const scheduleReconnect = useCallback(() => {
    timeoutRef.current = window.setTimeout(() => { attemptsRef.current += 1; connectRef.current(); }, getReconnectDelay(attemptsRef.current));
  }, []);

  const connect = useCallback(() => {
    if (!url || disposedRef.current) return;
    setStatus(ConnectionStatusValues.CONNECTING);
    const socket = new WebSocket(buildWebSocketUrl(url));
    socketRef.current = socket;
    attachSocketListeners(socket, onMessage, disposedRef, socketRef, attemptsRef, setStatus, scheduleReconnect);
  }, [onMessage, scheduleReconnect, url]);

  useEffect(() => {
    connectRef.current = connect;
    disposedRef.current = false;
    const tId = setTimeout(connect, 0);
    return () => {
      disposedRef.current = true;
      clearTimeout(tId);
      closeSocket(socketRef, timeoutRef);
    };
  }, [connect]);

  return { status, sendMessage: useCallback((data: unknown) => { sendJsonMessage(socketRef, data); }, []) };
};
