import { describe, expect, it, vi } from "vitest";
import { markNotificationReadIfNeeded } from "@/hooks/notifications/notificationDetailUtils";
import type { Notification } from "@/types";

describe("notificationDetailUtils", () => {
  it("marks an unread notification as read and returns the updated copy", async () => {
    const markRead = vi.fn().mockResolvedValue(undefined);
    const notification = { id: 3, is_read: false } as Notification;

    await expect(markNotificationReadIfNeeded(notification, markRead)).resolves.toEqual({
      ...notification,
      is_read: true,
    });
    expect(markRead).toHaveBeenCalledWith(3);
  });

  it("returns the original notification when marking as read fails", async () => {
    const markRead = vi.fn().mockRejectedValue(new Error("failed"));
    const notification = { id: 9, is_read: false } as Notification;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(markNotificationReadIfNeeded(notification, markRead)).resolves.toBe(notification);
    expect(consoleSpy).toHaveBeenCalledWith("Failed to mark notification as read", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
