import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { BrowserRouter } from 'react-router-dom';
import { NotificationType } from '../../src/types/notification';

const mockNotifications = [
  {
    id: 1,
    title: 'Test Notification 1',
    message: 'Message 1',
    is_read: false,
    timestamp: new Date().toISOString(),
    notification_type: NotificationType.CALENDAR,
    recipient: 1,
    sender: null,
    sender_username: null
  },
  {
    id: 2,
    title: 'Test Notification 2',
    message: 'Message 2',
    is_read: true,
    timestamp: new Date().toISOString(),
    notification_type: NotificationType.SYSTEM,
    recipient: 1,
    sender: null,
    sender_username: null
  }
];

describe('NotificationDropdown', () => {
  it('renders bell icon initially', () => {
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={[]} 
          unreadCount={0} 
          onMarkAllRead={() => undefined} 
          onDeleteAll={() => undefined}
          onItemClick={() => undefined} 
          onToggleRead={() => undefined}
          onDeleteItem={() => undefined}
        />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('View notifications')).toBeDefined();
  });

  it('opens dropdown when bell is clicked', async () => {
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={mockNotifications} 
          unreadCount={1} 
          onMarkAllRead={() => undefined} 
          onDeleteAll={() => undefined}
          onItemClick={() => undefined} 
          onToggleRead={() => undefined}
          onDeleteItem={() => undefined}
        />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByLabelText('View notifications'));
    
    expect(await screen.findByText(/Notifications \(/)).toBeDefined();
    expect(screen.getByText('Test Notification 1')).toBeDefined();
    expect(screen.getByText('Test Notification 2')).toBeDefined();
  });

  it('calls onMarkAllRead when button is clicked', async () => {
    const handleMarkAllRead = vi.fn();
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={mockNotifications} 
          unreadCount={1} 
          onMarkAllRead={handleMarkAllRead} 
          onDeleteAll={() => undefined}
          onItemClick={() => undefined} 
          onToggleRead={() => undefined}
          onDeleteItem={() => undefined}
        />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByLabelText('View notifications'));
    const markAllReadBtn = await screen.findByLabelText('Mark all as read');
    fireEvent.click(markAllReadBtn);
    fireEvent.click(await screen.findByText('Mark all'));
    
    expect(handleMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no notifications', async () => {
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={[]} 
          unreadCount={0} 
          onMarkAllRead={() => undefined} 
          onDeleteAll={() => undefined}
          onItemClick={() => undefined} 
          onToggleRead={() => undefined}
          onDeleteItem={() => undefined}
        />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByLabelText('View notifications'));
    expect(await screen.findByText('No notifications')).toBeDefined();
  });
});
