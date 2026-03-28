import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutHero from '../../../src/components/about/AboutHero';
import { MemoryRouter } from 'react-router-dom';
import useReveal from '../../../src/hooks/common/useReveal';

vi.mock('../../../src/hooks/common/useReveal', () => ({
  default: vi.fn(),
}));

describe('AboutHero Component', () => {
  it('renders correctly when not visible', () => {
    vi.mocked(useReveal).mockReturnValue([{ current: null }, false]);
    
    const { container } = render(
      <MemoryRouter>
        <AboutHero />
      </MemoryRouter>
    );

    const div = container.querySelector('div.mx-auto.max-w-3xl.text-center');
    expect(div).toHaveStyle({ opacity: '0', transform: 'translateY(20px)' });
    expect(screen.getByText('study smarter')).toBeTruthy();
  });

  it('renders correctly when visible', () => {
    vi.mocked(useReveal).mockReturnValue([{ current: null }, true]);
    
    const { container } = render(
      <MemoryRouter>
        <AboutHero />
      </MemoryRouter>
    );

    const div = container.querySelector('div.mx-auto.max-w-3xl.text-center');
    expect(div).toHaveStyle({ opacity: '1', transform: 'none' });
  });
});
