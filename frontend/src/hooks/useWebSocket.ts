import { useState, useEffect, useRef, useCallback } from 'react';

export enum ConnectionStatus {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

export const useWebSocket = (url: string | null, onMessage: (data: unknown) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!url) return;

    setStatus(ConnectionStatus.CONNECTING);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const fullUrl = url.startsWith('ws') ? url : `${protocol}//${host}${url}`;

    const socket = new WebSocket(fullUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus(ConnectionStatus.OPEN);
      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // silent: malformed messages are ignored
      }
    };

    socket.onclose = (event) => {
      setStatus(ConnectionStatus.CLOSED);
      socketRef.current = null;

      if (event.code !== 1000) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connect();
        }, timeout);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [url, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, sendMessage };
};
