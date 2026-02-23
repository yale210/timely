import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/useNotifications';
import * as notificationsApi from '../../src/api/notifications';

vi.mock('../../src/api/notifications');

describe('useNotifications hook', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should fetch notifications and unread count on mount', async () => {
        const mockData = {
            results: [{ id: 1, title: 'Test', is_read: false }],
            next: null
        };
        vi.mocked(notificationsApi.getNotifications).mockResolvedValue(mockData as any);
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 5 });

        const { result } = renderHook(() => useNotifications());

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual(mockData.results);
        expect(result.current.unreadCount).toBe(5);
    });

    it('should handle pagination', async () => {
        const page1 = { results: [{ id: 1 }], next: 'page2' };
        const page2 = { results: [{ id: 2 }], next: null };
        
        vi.mocked(notificationsApi.getNotifications)
            .mockResolvedValueOnce(page1 as any)
            .mockResolvedValueOnce(page2 as any);
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 });

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
        vi.mocked(notificationsApi.getNotifications).mockRejectedValue(new Error('Fetch failed'));
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 });

        const { result } = renderHook(() => useNotifications());
        
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Failed to fetch notifications');
    });

    it('should mark a notification as read', async () => {
        vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
            results: [{ id: 1, is_read: false }],
            next: null
        } as any);
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 });
        vi.mocked(notificationsApi.markAsRead).mockResolvedValue({});

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(1));

        await act(async () => {
            await result.current.markRead(1);
        });

        expect(notificationsApi.markAsRead).toHaveBeenCalledWith(1);
        expect(result.current.notifications[0].is_read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', async () => {
        vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
            results: [{ id: 1, is_read: false }, { id: 2, is_read: false }],
            next: null
        } as any);
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 2 });
        vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue({});

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(2));

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(notificationsApi.markAllAsRead).toHaveBeenCalled();
        expect(result.current.notifications.every(n => n.is_read)).toBe(true);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should delete a notification', async () => {
        vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
            results: [{ id: 1, is_read: false }],
            next: null
        } as any);
        vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 });
        vi.mocked(notificationsApi.deleteNotification).mockResolvedValue({});

        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.notifications.length).toBe(1));

        await act(async () => {
            await result.current.deleteNotification(1);
        });

        expect(notificationsApi.deleteNotification).toHaveBeenCalledWith(1);
        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
    });

    it('should handle unread count catch block', async () => {
        vi.mocked(notificationsApi.getNotifications).mockResolvedValue({ results: [], next: null } as any);
        vi.mocked(notificationsApi.getUnreadCount).mockRejectedValue(new Error('Count failed'));
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        const { result } = renderHook(() => useNotifications());
        await waitFor(() => expect(result.current.loading).toBe(false));
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch unread count', expect.any(Error));
        consoleSpy.mockRestore();
    });
});
