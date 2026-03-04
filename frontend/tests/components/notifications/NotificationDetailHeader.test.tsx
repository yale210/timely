/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationDetailHeader } from '@/components/notifications/NotificationDetailHeader';
import type { Notification } from '@/types/notification';

const baseNotification: Notification = {
  id: 1,
  title: 'Hello',
  message: 'Msg',
  timestamp: new Date().toISOString(),
  is_read: false,
  notification_type: 'SYSTEM' as any,
  recipient: 1,
  sender: null,
  sender_username: null,
};

describe('NotificationDetailHeader', () => {
  it('renders title, timestamp and toggles read state button', () => {
    const onToggleRead = vi.fn();
    const onDelete = vi.fn();
    render(<NotificationDetailHeader notification={baseNotification as any} onToggleRead={onToggleRead} onDelete={onDelete} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /Mark as read/i });
    fireEvent.click(toggle);
    expect(onToggleRead).toHaveBeenCalled();
  });

  it('shows sender when provided and delete button calls handler', () => {
    const onToggleRead = vi.fn();
    const onDelete = vi.fn();
    const notif = { ...baseNotification, sender_username: 'admin' } as any;
    render(<NotificationDetailHeader notification={notif} onToggleRead={onToggleRead} onDelete={onDelete} />);

    expect(screen.getByText(/Sent by/i)).toBeInTheDocument();
    const del = screen.getByRole('button', { name: /Delete notification/i });
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalled();
  });
});
