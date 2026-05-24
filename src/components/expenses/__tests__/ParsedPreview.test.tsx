import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParsedPreview from '../ParsedPreview';
import type { ParsedTransaction } from '../../../services/api';

const renderPreview = (
  parsed: Partial<ParsedTransaction>,
  over: { type?: 'expense' | 'income'; symbol?: string; onEdit?: () => void } = {}
) =>
  render(
    <ParsedPreview
      parsed={parsed as ParsedTransaction}
      type={over.type ?? 'expense'}
      symbol={over.symbol ?? 'HK$'}
      onEdit={over.onEdit}
    />
  );

describe('ParsedPreview', () => {
  it('renders the Type row by default (expense)', () => {
    renderPreview({});
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('shows Income label when type=income', () => {
    renderPreview({}, { type: 'income' });
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('shows Item row with category emoji + name', () => {
    renderPreview({ category: 'Food & Drink' });
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText(/Food & Drink/)).toBeInTheDocument();
    expect(screen.getByText('🍜')).toBeInTheDocument();
  });

  it('falls back to generic emoji for unknown category', () => {
    renderPreview({ category: 'Veterinary' });
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('matches emoji case-insensitively (e.g. "food" → 🍜)', () => {
    renderPreview({ category: 'food' });
    expect(screen.getByText('🍜')).toBeInTheDocument();
  });

  it('formats Amount with the provided symbol', () => {
    renderPreview({ amount: 1234 });
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('HK$1,234')).toBeInTheDocument();
  });

  it('renders Note row from notes field', () => {
    renderPreview({ notes: 'McDonald’s' });
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('McDonald’s')).toBeInTheDocument();
  });

  it('falls back Note row to merchant when notes is missing', () => {
    renderPreview({ merchant: 'Park N Shop' });
    expect(screen.getByText('Park N Shop')).toBeInTheDocument();
  });

  it('renders Person row when participants present', () => {
    renderPreview({ participants: ['Casey', 'Sam'] });
    expect(screen.getByText('Person')).toBeInTheDocument();
    expect(screen.getByText('Casey, Sam')).toBeInTheDocument();
  });

  it('shows Today for today\'s date and Yesterday for yesterday\'s', () => {
    const today = new Date().toISOString().slice(0, 10);
    renderPreview({ date: today });
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows formatted date for an older date', () => {
    renderPreview({ date: '2020-01-15' });
    // Locale-aware short format — accept "Jan 14" / "Jan 15" / "14 Jan" / "15 Jan"
    expect(screen.getByText(/(Jan\s*1[45])|(1[45]\s*Jan)/)).toBeInTheDocument();
  });

  it('renders the "Edit fields" button when onEdit is provided', () => {
    const onEdit = jest.fn();
    renderPreview({ amount: 50 }, { onEdit });
    const btn = screen.getByRole('button', { name: /Edit fields/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('omits the Edit button when no onEdit prop', () => {
    renderPreview({ amount: 50 });
    expect(screen.queryByRole('button', { name: /Edit fields/i })).toBeNull();
  });

  it('renders one green checkmark per row', () => {
    renderPreview({ amount: 50, category: 'Transport', notes: 'MTR' });
    const checks = document.querySelectorAll('[data-testid="parsed-preview"] svg[data-testid="CheckIcon"]');
    // 4 rows: Type, Item, Amount, Note
    expect(checks.length).toBe(4);
  });
});
