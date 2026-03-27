import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState — branch coverage', () => {
  it('renders heading and subtext', () => {
    render(<EmptyState heading="No expenses" subtext="Add your first expense" />);
    expect(screen.getByText('No expenses')).toBeInTheDocument();
    expect(screen.getByText('Add your first expense')).toBeInTheDocument();
  });

  it('does not render CTA button when ctaLabel and onCta are absent', () => {
    render(<EmptyState heading="No data" subtext="Nothing here" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render CTA button when ctaLabel provided but onCta absent', () => {
    render(<EmptyState heading="No data" subtext="Nothing here" ctaLabel="Add" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render CTA button when onCta provided but ctaLabel absent', () => {
    render(<EmptyState heading="No data" subtext="Nothing here" onCta={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders CTA button when both ctaLabel and onCta are provided', () => {
    const onCta = jest.fn();
    render(<EmptyState heading="No data" subtext="Nothing here" ctaLabel="Add Expense" onCta={onCta} />);
    const btn = screen.getByRole('button', { name: 'Add Expense' });
    expect(btn).toBeInTheDocument();
  });

  it('calls onCta when CTA button is clicked', () => {
    const onCta = jest.fn();
    render(<EmptyState heading="No data" subtext="Nothing here" ctaLabel="Add" onCta={onCta} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
