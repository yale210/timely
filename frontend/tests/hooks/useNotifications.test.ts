import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/useNotifications';
import * as notificationsApi from '../../src/api/notifications';
import type { NotificationListResponse } from '../../src/types/notification';

vi.mock('../../src/api/notifications');

describe('useNotifications hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch notifications and unread count on mount', async () => {
        const mockData: NotificationListResponse = {
            results: [{ id: 1, title: 'Test', is_read: false, message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }],
            count: 1,
            next: null,
            previous: null
        };
        vi.spyOn(notificationsApi, "getNotifications").mockResolvedValue(mockData);
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 5 });

        const { result } = renderHook(() => useNotifications());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual(mockData.results);
        expect(result.current.unreadCount).toBe(5);
    });

    it('should handle pagination', async () => {
        const page1: NotificationListResponse = { results: [{ id: 1, title: '', is_read: false, message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }], count: 2, next: 'page2', previous: null };
        const page2: NotificationListResponse = { results: [{ id: 2, title: '', is_read: false, message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }], count: 2, next: null, previous: 'page1' };
        
        vi.spyOn(notificationsApi, "getNotifications")
            .mockResolvedValueOnce(page1)
            .mockResolvedValueOnce(page2);
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 1 });

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(1));

        await act(async () => {
            await result.current.fetchNotifications(2);
        });

        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.notifications[1].id).toBe(2);
        expect(result.current.hasMore).toBe(false);
    });

    it('should handle fetch errors', async () => {
        vi.spyOn(notificationsApi, "getNotifications").mockRejectedValue(new Error('Fetch failed'));
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 0 });

        const { result } = renderHook(() => useNotifications());
        
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Failed to fetch notifications');
    });

    it('should mark a notification as read', async () => {
        vi.spyOn(notificationsApi, "getNotifications").mockResolvedValue({
            results: [{ id: 1, is_read: false, title: '', message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }],
            count: 1,
            next: null,
            previous: null
        });
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 1 });
        const markSpy = vi.spyOn(notificationsApi, "markAsRead").mockResolvedValue(undefined);

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(1));

        await act(async () => {
            await result.current.markRead(1);
        });

        expect(markSpy).toHaveBeenCalledWith(1);
        expect(result.current.notifications[0].is_read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', async () => {
        vi.spyOn(notificationsApi, "getNotifications").mockResolvedValue({
            results: [{ id: 1, is_read: false, title: '', message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }, { id: 2, is_read: false, title: '', message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }],
            count: 2,
            next: null,
            previous: null
        });
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 2 });
        const markAllSpy = vi.spyOn(notificationsApi, "markAllAsRead").mockResolvedValue(undefined);

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(2));

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(markAllSpy).toHaveBeenCalled();
        expect(result.current.notifications.every(n => n.is_read)).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should delete a notification', async () => {
        vi.spyOn(notificationsApi, "getNotifications").mockResolvedValue({
            results: [{ id: 1, is_read: false, title: '', message: '', recipient: 1, sender: null, sender_username: null, timestamp: '', notification_type: 'SYSTEM' }],
            count: 1,
            next: null,
            previous: null
        });
        vi.spyOn(notificationsApi, "getUnreadCount").mockResolvedValue({ count: 1 });
        const deleteSpy = vi.spyOn(notificationsApi, "deleteNotification").mockResolvedValue(undefined);

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(1));

        await act(async () => {
            await result.current.deleteNotification(1);
        });

        expect(deleteSpy).toHaveBeenCalledWith(1);
        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should handle unread count catch block', async () => {
        vi.spyOn(notificationsApi, "getNotifications").mockResolvedValue({ results: [], count: 0, next: null, previous: null });
        vi.spyOn(notificationsApi, "getUnreadCount").mockRejectedValue(new Error('Count failed'));
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
        
        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.loading).toBe(false));
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch unread count', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
