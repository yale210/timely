import type React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GradebookHeader from '@/components/gradebook/GradebookHeader';

// Mock out @headlessui/react completely to avoid ResizeObserver issues
vi.mock('@headlessui/react', () => ({
  Menu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MenuButton: ({ children, onClick }: { children: React.ReactNode; onClick?: React.MouseEventHandler }) => (
    <button onClick={onClick}>{children}</button>
  ),
  MenuItems: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MenuItem: ({ children }: { children: (props: { focus: boolean }) => React.ReactNode }) => <div>{children({ focus: false })}</div>,
}));

describe('GradebookHeader Component', () => {
  const defaultProps = {
    setModalOpen: vi.fn(),
    search: '',
    sortBy: 'date_desc' as const,
    performanceFilter: 'all' as const,
    selectedCategoryId: null,
    categories: [
      { id: 1, text: 'Homework' },
      { id: 2, text: 'Exam' },
    ],
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onPerformanceFilterChange: vi.fn(),
    onCategoryChange: vi.fn(),
  };

  it('renders header elements correctly', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    expect(screen.getByText('Gradebook')).toBeTruthy();
    expect(screen.getByPlaceholderText('Search grades')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Filter/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sort/i })).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('handles search input', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search grades');
    fireEvent.change(input, { target: { value: 'math' } });
    
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('math');
  });

  it('opens new grade modal', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    fireEvent.click(screen.getByText('New'));
    
    expect(defaultProps.setModalOpen).toHaveBeenCalledWith(true);
  });

  it('handles performance filter changes', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    // Click 'Excellent (85%+)'
    fireEvent.click(screen.getByText('Excellent (85%+)'));
    
    expect(defaultProps.onPerformanceFilterChange).toHaveBeenCalledWith('excellent');
  });

  it('handles category filter changes', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    // Click 'Exam' category
    fireEvent.click(screen.getByText('Exam'));
    
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(2);
    
    // Click 'All categories'
    fireEvent.click(screen.getByText('All categories'));
    
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it('handles sort changes', () => {
    render(<GradebookHeader {...defaultProps} />);
    
    // Click 'Highest percentage'
    fireEvent.click(screen.getByText('Highest percentage'));
    
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('percentage_desc');
  });
});
