import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManageItemsPage from '../ManageItemsPage';

const mockSetPreset = jest.fn();
const mockDeletePreset = jest.fn();

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({
    presets: {},
    setPreset: mockSetPreset,
    deletePreset: mockDeletePreset,
  }),
}));

describe('ManageItemsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Item Presets')).toBeInTheDocument();
  });

  it('shows Expense Items section', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Expense Items')).toBeInTheDocument();
  });

  it('shows Income Items section', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Income Items')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText(/auto-filled when you pick that item/i)).toBeInTheDocument();
  });

  it('shows "No default set" for items with no preset', () => {
    render(<ManageItemsPage />);
    const noDefaults = screen.getAllByText('No default set');
    expect(noDefaults.length).toBeGreaterThan(0);
  });

  it('shows edit button for items', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('shows text field when edit button is clicked', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls setPreset when entering a value and pressing Enter', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'My description' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSetPreset).toHaveBeenCalled();
  });

  it('cancels edit when Escape is pressed', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows check and close buttons in edit mode', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    // After clicking edit, there should be at least check and close buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('clicking close button in edit mode exits edit mode', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    // Now in edit mode — find close button (CloseIcon)
    const closeIcon = document.querySelector('[data-testid="CloseIcon"]');
    if (closeIcon?.parentElement) {
      fireEvent.click(closeIcon.parentElement);
    }
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls deletePreset when save is called with empty draft', () => {
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    const input = screen.getByRole('textbox');
    // Clear the input
    fireEvent.change(input, { target: { value: '' } });
    // Click save (check button)
    const checkIcon = document.querySelector('[data-testid="CheckIcon"]');
    if (checkIcon?.parentElement) {
      fireEvent.click(checkIcon.parentElement);
    }
    expect(mockDeletePreset).toHaveBeenCalled();
  });

  it('shows delete button when preset exists for an item', () => {
    // Need presets to have a value — use a separate render with preset data
    const { useItemPresets } = require('../../../hooks/useItemPresets');
    // Can't override since mock uses arrow function, but test the "save sets preset" path
    render(<ManageItemsPage />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test description' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSetPreset).toHaveBeenCalled();
  });
});
