import { render, act, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import useReveal from '@/hooks/common/useReveal';

describe('useReveal Hook', () => {
  let intersectionCallback: IntersectionObserverCallback;
  let observeMock: Mock;
  let disconnectMock: Mock;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn((callback) => {
      intersectionCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: vi.fn(),
        takeRecords: vi.fn(),
      } as unknown as IntersectionObserver;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const TestComponent = ({ threshold }: { threshold?: number }) => {
    const [ref, visible] = useReveal(threshold);
    return (
      <div ref={ref} data-testid="target">
        {visible ? 'Visible' : 'Hidden'}
      </div>
    );
  };

  it('sets up IntersectionObserver and updates visibility', () => {
    const { unmount } = render(<TestComponent threshold={0.5} />);

    expect(screen.getByTestId('target').textContent).toBe('Hidden');
    expect(window.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { threshold: 0.5 });
    expect(observeMock).toHaveBeenCalled();

    // Trigger intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(screen.getByTestId('target').textContent).toBe('Visible');
    expect(disconnectMock).toHaveBeenCalled(); // Should disconnect after becoming visible

    // Trigger again (should not change anything, already visible)
    act(() => {
      intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(screen.getByTestId('target').textContent).toBe('Visible');

    unmount();
    // disconnect might be called again on unmount
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('ignores intersection if not intersecting', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('target').textContent).toBe('Hidden');

    // Trigger intersection with false
    act(() => {
      intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(screen.getByTestId('target').textContent).toBe('Hidden');
    expect(disconnectMock).not.toHaveBeenCalled(); // Only disconnects on unmount or when visible
  });
});
