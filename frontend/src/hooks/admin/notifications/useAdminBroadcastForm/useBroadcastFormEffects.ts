import { useEffect } from "react";

/**
 * Hook to manage side effects for the broadcast form.
 * @param title - Current title.
 * @param message - Current message.
 * @param setPreviewTitle - Setter for preview title.
 * @param setPreviewMessage - Setter for preview message.
 */
export const useBroadcastFormEffects = (
  title: string,
  message: string,
  setPreviewTitle: (v: string) => void,
  setPreviewMessage: (v: string) => void
) => {
  useEffect(() => {
    const t = setTimeout(() => {
      setPreviewTitle(title.trim());
      setPreviewMessage(message.trim());
    }, 200);
    return () => clearTimeout(t);
  }, [message, title, setPreviewTitle, setPreviewMessage]);
};
