/**
 * Builds an absolute WebSocket URL from an app-relative path.
 * @param url - The relative or absolute WebSocket URL.
 */
export const buildWebSocketUrl = (url: string) => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return url.startsWith("ws") ? url : `${protocol}//${window.location.host}${url}`;
};

/**
 * Returns the reconnect delay for the given retry attempt.
 * @param attempt - The current reconnect attempt number.
 */
export const getReconnectDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

/**
 * Parses an incoming WebSocket payload and forwards valid JSON messages.
 * @param payload - The raw message payload.
 * @param onMessage - Called when the payload is valid JSON.
 */
export const handleWebSocketMessage = (payload: string, onMessage: (data: unknown) => void) => {
  try {
    onMessage(JSON.parse(payload));
  } catch {
    return;
  }
};
