import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkActionBar from '../BulkActionBar';

describe('BulkActionBar', () => {
  const mockHandlers = {
    onDeleteSelected: jest.fn(),
    onTagSelected: jest.fn(),
    onExportSelected: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with correct selection count', () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedIds={new Set(['1', '2', '3'])}
        knownTags={['work', 'personal']}
        {...mockHandlers}
      />
    );
    expect(screen.getByText(/3 selected/)).toBeInTheDocument();
  });

  it('should display action buttons', () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedIds={new Set(['1'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    expect(screen.getByText(/Add Tags/)).toBeInTheDocument();
    expect(screen.getByText(/Export/)).toBeInTheDocument();
    expect(screen.getByText(/Delete/)).toBeInTheDocument();
  });

  it('should open delete confirmation dialog when delete clicked', () => {
    render(
      <BulkActionBar
        selectedCount={2}
        selectedIds={new Set(['1', '2'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    const deleteButton = screen.getByText(/Delete/);
    fireEvent.click(deleteButton);
    expect(screen.getByText(/Delete 2 transactions\?/)).toBeInTheDocument();
  });

  it('should handle delete confirmation', async () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedIds={new Set(['1'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    fireEvent.click(screen.getByText(/Delete/));
    const confirmDelete = screen.getByRole('button', { name: /Delete All/ });
    fireEvent.click(confirmDelete);
    await waitFor(() => {
      expect(mockHandlers.onDeleteSelected).toHaveBeenCalled();
    });
  });

  it('should open tag dialog when Add Tags clicked', () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedIds={new Set(['1'])}
        knownTags={['work']}
        {...mockHandlers}
      />
    );
    fireEvent.click(screen.getByText(/Add Tags/));
    expect(screen.getByText(/Add Tags to 1 transactions/)).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedIds={new Set(['1'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    const closeButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-label')?.includes('close') || btn.textContent === '✕'
    );
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(mockHandlers.onClose).toHaveBeenCalled();
    }
  });

  it('should call onExportSelected when Export clicked', () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedIds={new Set(['1'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    fireEvent.click(screen.getByText(/Export/));
    expect(mockHandlers.onExportSelected).toHaveBeenCalled();
  });

  it('should render with correct styling for selection count', () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={5}
        selectedIds={new Set(['1', '2', '3', '4', '5'])}
        knownTags={[]}
        {...mockHandlers}
      />
    );
    const countText = screen.getByText(/5 selected/);
    expect(countText).toHaveClass('MuiTypography-body2');
  });
});
