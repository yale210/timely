import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// Vitest/vite alias resolution can vary in some environments; use a relative path fallback.
import StatCard from '../../../src/components/dashboard/StatCard';
import { MemoryRouter } from 'react-router-dom';

describe('StatCard', () => {
  it('renders title, values and See More link', () => {
    render(
      <MemoryRouter>
        <StatCard title="Tasks" value={["One", "Two"]} seeMoreHref="/more" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Tasks/i)).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();

  const link = screen.getByRole('link', { name: /See More/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', '/more');
  });

  it('renders empty state when no values provided', () => {
    render(
      <MemoryRouter>
        <StatCard title="Empty" value={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/No tasks\./i)).toBeInTheDocument();
  });
});
