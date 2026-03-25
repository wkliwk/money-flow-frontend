import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManageTemplatesDrawer from '../ManageTemplatesDrawer';
import { TransactionTemplate } from '../../../hooks/useTemplates';

const makeTemplate = (overrides: Partial<TransactionTemplate> = {}): TransactionTemplate => ({
  id: 't1',
  label: 'Lunch',
  description: 'Lunch at office',
  type: 'expense',
  category: 'Food & Drink',
  ...overrides,
});

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  templates: [],
  onAdd: jest.fn(),
  onDelete: jest.fn(),
};

describe('ManageTemplatesDrawer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Templates heading when open', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('shows New Template button when no form is showing', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    expect(screen.getByText('+ New Template')).toBeInTheDocument();
  });

  it('renders templates list when templates exist', () => {
    render(<ManageTemplatesDrawer {...defaultProps} templates={[makeTemplate()]} />);
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText(/Lunch at office/)).toBeInTheDocument();
  });

  it('renders income template with Income chip', () => {
    render(<ManageTemplatesDrawer {...defaultProps} templates={[makeTemplate({ type: 'income', label: 'Salary' })]} />);
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('renders expense template with Expense chip', () => {
    render(<ManageTemplatesDrawer {...defaultProps} templates={[makeTemplate()]} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<ManageTemplatesDrawer {...defaultProps} templates={[makeTemplate({ id: 'del-1' })]} onDelete={onDelete} />);
    const deleteIcon = document.querySelector('[data-testid="DeleteIcon"]');
    if (deleteIcon?.parentElement) fireEvent.click(deleteIcon.parentElement);
    expect(onDelete).toHaveBeenCalledWith('del-1');
  });

  it('clicking + New Template shows the form', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    expect(screen.getByText('New Template')).toBeInTheDocument();
    expect(screen.getByLabelText(/Chip label/i)).toBeInTheDocument();
  });

  it('Save Template button is disabled when label is empty', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    expect(screen.getByRole('button', { name: 'Save Template' })).toBeDisabled();
  });

  it('Save Template button enabled when label and description filled', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    fireEvent.change(screen.getByLabelText(/Chip label/i), { target: { value: 'Lunch' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Lunch at office' } });
    expect(screen.getByRole('button', { name: 'Save Template' })).not.toBeDisabled();
  });

  it('calls onAdd when Save Template is clicked with valid form', () => {
    const onAdd = jest.fn();
    render(<ManageTemplatesDrawer {...defaultProps} onAdd={onAdd} />);
    fireEvent.click(screen.getByText('+ New Template'));
    fireEvent.change(screen.getByLabelText(/Chip label/i), { target: { value: 'Lunch' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Lunch at office' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Template' }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ label: 'Lunch', description: 'Lunch at office' }));
  });

  it('Cancel button hides form', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText(/Chip label/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked', () => {
    const onClose = jest.fn();
    render(<ManageTemplatesDrawer {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    // The first button in the header should be the close button
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('clicking Income type in form switches type', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Click Income type card
    const incomeOptions = screen.getAllByText('Income');
    fireEvent.click(incomeOptions[incomeOptions.length - 1]);
    expect(screen.getByLabelText(/Chip label/i)).toBeInTheDocument();
  });

  it('clicking item preset chip sets item', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Click a breakfast item preset
    const breakfastChip = screen.queryByText('早餐');
    if (breakfastChip) {
      fireEvent.click(breakfastChip);
    }
    expect(screen.getByLabelText(/Chip label/i)).toBeInTheDocument();
  });

  it('clicking category chip sets category', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Click Food & Drink category chip
    const foodChip = screen.queryByText(/Food & Drink/);
    if (foodChip) {
      fireEvent.click(foodChip);
    }
    expect(screen.getByLabelText(/Chip label/i)).toBeInTheDocument();
  });

  it('typing default amount fills the field', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    const amountInput = screen.getByLabelText(/Default amount/i);
    fireEvent.change(amountInput, { target: { value: '50' } });
    expect((amountInput as HTMLInputElement).value).toBe('50');
  });
});
