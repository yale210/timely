import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationDetailBody } from '@/components/notifications/NotificationDetailBody';

describe('NotificationDetailBody', () => {
  it('renders message and preserves formatting', () => {
    const message = 'Line1\nLine2\n\nIndented';
    render(<NotificationDetailBody message={message} />);

    const el = screen.getByText(/Line1/);
    expect(el).toBeInTheDocument();
    expect(screen.getByText(/Line2/)).toBeInTheDocument();
    expect(screen.getByText(/Indented/)).toBeInTheDocument();
  });
});
