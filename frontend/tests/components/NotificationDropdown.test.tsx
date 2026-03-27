import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { BrowserRouter } from 'react-router-dom';
import { NotificationType } from '@/types';

vi.mock('@/hooks/friends/useFriendships', () => ({
  useFriendships: () => ({
    friendships: [],
    loading: false,
    error: null,
    sending: false,
    actingIds: new Set<number>(),
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
    sendRequest: vi.fn(),
    removeFriend: vi.fn(),
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

  it('calls onDeleteItem when delete button is clicked', async () => {
    const handleDeleteItem = vi.fn();
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={mockNotifications} 
          unreadCount={1} 
          onItemClick={() => undefined} 
          onToggleRead={() => undefined}
          onDeleteItem={handleDeleteItem}
        />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByLabelText('View notifications'));
    const deleteButtons = await screen.findAllByLabelText('Delete notification');
    fireEvent.click(deleteButtons[0]);
    expect(handleDeleteItem).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no notifications', async () => {
    render(
      <BrowserRouter>
        <NotificationDropdown 
          notifications={[]} 
          unreadCount={0} 
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
