import { createContext, useContext, type ReactNode } from "react";
import { useNotificationLogic } from "@/hooks/notifications/useNotificationLogic";
import { type Notification } from "@/types";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markUnread: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Retrieves the current notification context value, throwing if used outside a provider.
 * @returns The notification context value.
 */
export const useNotificationContext = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return ctx;
};

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provides notification state and actions to descendant components via context.
 * @param props - The component props.
 * @param props.children - Child components that consume the notification context.
 * @returns A context provider wrapping the children.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const logic = useNotificationLogic();

  return <NotificationContext.Provider value={logic}>{children}</NotificationContext.Provider>;
};
