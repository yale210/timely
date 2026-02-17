import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Notifications } from '../../src/pages/Notifications';
import { BrowserRouter } from 'react-router-dom';
import { NotificationType } from '../../src/types/notification';

vi.mock('../../src/context/NotificationContext', () => ({
  useNotificationContext: vi.fn(),
}));

import { useNotificationContext } from '../../src/context/NotificationContext';
vi.mock('../../src/hooks/usePushSubscription', () => ({
  usePushSubscription: () => ({
    isSupported: false,
    isSubscribed: false,
    permission: 'default' as const,
    loading: false,
    error: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockNotifications = [
  {
    id: 1,
    title: 'Test Notification 1',
    message: 'Message 1',
    is_read: false,
    timestamp: new Date().toISOString(),
    notification_type: NotificationType.REMINDER,
    recipient: 1,
    sender: null,
    sender_username: null
  }
];

const defaultContextValue = {
  notifications: [] as typeof mockNotifications,
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: false,
  page: 1,
  fetchNotifications: vi.fn(),
  fetchUnreadCount: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  deleteNotification: vi.fn(),
};

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    expect(screen.getByText('Notifications')).toBeDefined();
  });

  it('displays loading state', () => {
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      loading: true,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading notifications...')).toBeDefined();
  });

  it('displays notifications list', () => {
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      notifications: mockNotifications,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    expect(screen.getByText('Test Notification 1')).toBeDefined();
  });

  it('calls markAllRead when button is clicked', () => {
    const markAllRead = vi.fn();
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      notifications: mockNotifications,
      markAllRead,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Mark all as read'));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });
});
