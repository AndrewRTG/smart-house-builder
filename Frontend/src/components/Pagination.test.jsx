import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('does not render when there is a single page', () => {
    const { container } = render(<Pagination currentPage={0} totalPages={1} onPageChange={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders page controls and calls page changes', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
        className="custom-pagination"
      />
    );

    expect(screen.getByText('2')).toHaveClass('active');
    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();

    fireEvent.click(screen.getByText('Previous'));
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('Next'));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 0);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(4, 2);
  });

  it('disables boundary navigation buttons', () => {
    const { rerender } = render(<Pagination currentPage={0} totalPages={2} onPageChange={vi.fn()} />);

    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();

    rerender(<Pagination currentPage={1} totalPages={2} onPageChange={vi.fn()} />);

    expect(screen.getByText('Previous')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });
});
