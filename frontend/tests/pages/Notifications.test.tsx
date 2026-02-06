import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Notifications } from '../../src/pages/Notifications';
import { BrowserRouter } from 'react-router-dom';
import { useNotifications } from '../../src/hooks/useNotifications';
import { NotificationType } from '../../src/types/notification';

vi.mock('../../src/hooks/useNotifications');

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

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    (useNotifications as any).mockReturnValue({
      notifications: [],
      loading: false,
      error: null,
      hasMore: false,
      page: 1,
      fetchNotifications: vi.fn(),
      markAllRead: vi.fn(),
      markRead: vi.fn()
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    expect(screen.getByText('Notifications')).toBeDefined();
  });

  it('displays loading state', () => {
    (useNotifications as any).mockReturnValue({
      notifications: [],
      loading: true,
      error: null,
      hasMore: false,
      page: 1,
      fetchNotifications: vi.fn(),
      markAllRead: vi.fn(),
      markRead: vi.fn()
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading notifications...')).toBeDefined();
  });

  it('displays notifications list', () => {
    (useNotifications as any).mockReturnValue({
      notifications: mockNotifications,
      loading: false,
      error: null,
      hasMore: false,
      page: 1,
      fetchNotifications: vi.fn(),
      markAllRead: vi.fn(),
      markRead: vi.fn()
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
    (useNotifications as any).mockReturnValue({
      notifications: mockNotifications,
      loading: false,
      error: null,
      hasMore: false,
      page: 1,
      fetchNotifications: vi.fn(),
      markAllRead,
      markRead: vi.fn()
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
