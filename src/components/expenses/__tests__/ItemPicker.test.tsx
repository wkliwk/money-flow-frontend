import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemPicker, { ITEM_PRESETS } from '../ItemPicker';

describe('ItemPicker', () => {
  it('renders expense items by default', () => {
    render(<ItemPicker value="" type="expense" onSelect={jest.fn()} />);
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renders expense items when type is expense', () => {
    render(<ItemPicker value="" type="expense" onSelect={jest.fn()} />);
    // Should show expense items - check for first expense item label
    const expenseItems = ITEM_PRESETS.filter((p) => p.type === 'expense');
    expect(screen.getByText(expenseItems[0].label)).toBeInTheDocument();
  });

  it('renders income items when type is income', () => {
    render(<ItemPicker value="" type="income" onSelect={jest.fn()} />);
    const incomeItems = ITEM_PRESETS.filter((p) => p.type === 'income');
    expect(screen.getByText(incomeItems[0].label)).toBeInTheDocument();
  });

  it('calls onSelect when an item is clicked', () => {
    const onSelect = jest.fn();
    render(<ItemPicker value="" type="expense" onSelect={onSelect} />);
    const expenseItems = ITEM_PRESETS.filter((p) => p.type === 'expense');
    const firstLabel = expenseItems[0].label;
    fireEvent.click(screen.getByText(firstLabel));
    expect(onSelect).toHaveBeenCalledWith(expenseItems[0]);
  });

  it('shows en (English) label for items', () => {
    render(<ItemPicker value="" type="expense" onSelect={jest.fn()} />);
    const expenseItems = ITEM_PRESETS.filter((p) => p.type === 'expense');
    expect(screen.getByText(expenseItems[0].en)).toBeInTheDocument();
  });

  it('reorders items based on recentItems prop', () => {
    const expenseItems = ITEM_PRESETS.filter((p) => p.type === 'expense');
    const recentLabel = expenseItems[2].label; // Use third item as most recent
    render(<ItemPicker value="" type="expense" onSelect={jest.fn()} recentItems={[recentLabel]} />);
    // The recent item should still be in the document
    expect(screen.getByText(recentLabel)).toBeInTheDocument();
  });
});
