import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutCta from '@/components/about/AboutCta';
import { MemoryRouter } from 'react-router-dom';
import useReveal from '@/hooks/common/useReveal';

vi.mock('@/hooks/common/useReveal', () => ({
  default: vi.fn(),
}));

describe('AboutCta Component', () => {
  it('renders correctly when not visible', () => {
    vi.mocked(useReveal).mockReturnValue([{ current: null }, false]);
    
    const { container } = render(
      <MemoryRouter>
        <AboutCta />
      </MemoryRouter>
    );

    const div = container.querySelector('div.mx-auto');
    expect(div).toHaveStyle({ opacity: '0', transform: 'translateY(20px)' });
    expect(screen.getByText('Ready to take control of your time?')).toBeTruthy();
  });

  it('renders correctly when visible', () => {
    vi.mocked(useReveal).mockReturnValue([{ current: null }, true]);
    
    const { container } = render(
      <MemoryRouter>
        <AboutCta />
      </MemoryRouter>
    );

    const div = container.querySelector('div.mx-auto');
    expect(div).toHaveStyle({ opacity: '1', transform: 'none' });
  });
});
