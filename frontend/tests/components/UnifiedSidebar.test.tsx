import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import UnifiedSidebar from './UnifiedSidebar';

describe('UnifiedSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <UnifiedSidebar isOpen={true} onClose={vi.fn()} categories={[]} onSubmitTask={vi.fn()} onSubmitEvent={vi.fn()} />
    );

    expect(container).toBeInTheDocument();
  });
});

