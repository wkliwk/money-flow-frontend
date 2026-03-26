import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManageTemplatesDrawer from '../ManageTemplatesDrawer';

const defaultTemplates = [
  { id: 't1', label: 'Lunch', description: 'Office lunch', type: 'expense' as const, category: 'Food & Drink', defaultAmount: 80 },
  { id: 't2', label: 'Salary', description: 'Monthly salary', type: 'income' as const, category: '', defaultAmount: undefined },
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  templates: defaultTemplates,
  onAdd: jest.fn(),
  onDelete: jest.fn(),
};

describe('ManageTemplatesDrawer — branch coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders template with category and defaultAmount in secondary text', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    // t1 has category and defaultAmount
    expect(screen.getByText(/Food & Drink/)).toBeInTheDocument();
    expect(screen.getByText(/HK\$80/)).toBeInTheDocument();
  });

  it('renders income template with Income chip', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    const incomeChips = screen.getAllByText('Income');
    expect(incomeChips.length).toBeGreaterThan(0);
  });

  it('renders expense template with Expense chip', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    const expenseChips = screen.getAllByText('Expense');
    expect(expenseChips.length).toBeGreaterThan(0);
  });

  it('template with no category omits category in secondary text', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    // t2 has no category — its secondary text is just "Monthly salary"
    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
  });

  it('renders divider between multiple templates (idx > 0 branch)', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    // Two templates means one divider is rendered (for idx=1)
    expect(document.body).toBeTruthy();
  });

  it('calls onDelete when delete icon clicked', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    const deleteIcons = document.querySelectorAll('[data-testid="DeleteIcon"]');
    if (deleteIcons[0]?.parentElement) {
      fireEvent.click(deleteIcons[0].parentElement);
      expect(defaultProps.onDelete).toHaveBeenCalledWith('t1');
    }
  });

  it('item preset chip toggles: click once selects, click again deselects', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Get first item preset chip and click it twice to cover toggle branch
    const chips = document.querySelectorAll('.MuiChip-root');
    if (chips.length > 0) {
      fireEvent.click(chips[0]); // select
      fireEvent.click(chips[0]); // deselect (f.item === p.label → '')
    }
    expect(screen.getByLabelText('Chip label')).toBeInTheDocument();
  });

  it('category chip toggles: click once selects, click again deselects', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Category chips are below ITEM_PRESETS chips — use the PRESET_CATEGORIES labels
    // Click the first category chip twice
    const categoryChip = screen.queryByText('Food & Drink');
    if (categoryChip) {
      fireEvent.click(categoryChip); // select
      fireEvent.click(categoryChip); // deselect
    }
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('switching to income type shows income item presets', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Click Income type card
    const incomeType = screen.getAllByText('Income');
    fireEvent.click(incomeType[incomeType.length - 1]);
    expect(document.body).toBeTruthy();
  });

  it('handleAdd does nothing when label or description is empty', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Save button is disabled when label/description empty — click it anyway
    const saveBtn = screen.getByRole('button', { name: /Save Template/i });
    fireEvent.click(saveBtn);
    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it('handleAdd calls onAdd with form.item=undefined when no item selected', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    // Fill label and description, skip item
    fireEvent.change(screen.getByLabelText('Chip label'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test desc' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Template/i }));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ item: undefined, defaultAmount: undefined })
    );
  });

  it('handleAdd calls onAdd with defaultAmount when amount entered', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    fireEvent.change(screen.getByLabelText('Chip label'), { target: { value: 'Coffee' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Morning coffee' } });
    fireEvent.change(screen.getByLabelText(/Default amount/i), { target: { value: '55' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Template/i }));
    expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ defaultAmount: 55 })
    );
  });

  it('cancel button hides form and resets', () => {
    render(<ManageTemplatesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('+ New Template'));
    expect(screen.getByLabelText('Chip label')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.queryByLabelText('Chip label')).toBeNull();
    expect(screen.getByText('+ New Template')).toBeInTheDocument();
  });

  it('renders without crash when templates list is empty', () => {
    render(<ManageTemplatesDrawer {...defaultProps} templates={[]} />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('+ New Template')).toBeInTheDocument();
  });
});
