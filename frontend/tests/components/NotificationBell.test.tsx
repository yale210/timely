import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationBell } from '../../src/components/NotificationBell';

describe('NotificationBell', () => {
  it('renders bell icon', () => {
    render(<NotificationBell unreadCount={0} onClick={() => undefined} />);
    expect(screen.getByLabelText('View notifications')).toBeDefined();
  });

  it('shows badge with correct count', () => {
    render(<NotificationBell unreadCount={5} onClick={() => undefined} />);
    expect(screen.getByText('5')).toBeDefined();
  });

  it('shows "9+" for counts over 9', () => {
    render(<NotificationBell unreadCount={12} onClick={() => undefined} />);
    expect(screen.getByText('9+')).toBeDefined();
  });

  it('hides badge when count is 0', () => {
    render(<NotificationBell unreadCount={0} onClick={() => undefined} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<NotificationBell unreadCount={0} onClick={handleClick} />);
    fireEvent.click(screen.getByLabelText('View notifications'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
