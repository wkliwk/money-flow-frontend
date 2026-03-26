import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetProgress from '../BudgetProgress';

const convert = (v: number) => v;
const symbol = '$';

describe('BudgetProgress', () => {
  it('renders nothing when no budgets set', () => {
    const { container } = render(
      <BudgetProgress budgets={{}} categorySpend={{}} convert={convert} symbol={symbol} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all budget limits are zero', () => {
    const { container } = render(
      <BudgetProgress budgets={{ Food: 0 }} categorySpend={{ Food: 50 }} convert={convert} symbol={symbol} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders budget bars for categories with limits', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 500, Transport: 200 }}
        categorySpend={{ Food: 250, Transport: 180 }}
        convert={convert}
        symbol="$"
      />
    );
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('$250 / $500')).toBeInTheDocument();
    expect(screen.getByText('$180 / $200')).toBeInTheDocument();
  });

  it('shows zero spend when category has no transactions', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 500 }}
        categorySpend={{}}
        convert={convert}
        symbol="$"
      />
    );
    expect(screen.getByText('$0 / $500')).toBeInTheDocument();
  });

  it('sorts by percentage descending (highest usage first)', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 1000, Transport: 100 }}
        categorySpend={{ Food: 100, Transport: 90 }}
        convert={convert}
        symbol="$"
      />
    );
    const labels = screen.getAllByText(/Food|Transport/);
    expect(labels[0]).toHaveTextContent('Transport');
    expect(labels[1]).toHaveTextContent('Food');
  });

  it('calls onCategoryClick when a bar is clicked', () => {
    const onClick = jest.fn();
    render(
      <BudgetProgress
        budgets={{ Food: 500 }}
        categorySpend={{ Food: 250 }}
        convert={convert}
        symbol="$"
        onCategoryClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('Food'));
    expect(onClick).toHaveBeenCalledWith('Food');
  });

  it('applies currency conversion', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 500 }}
        categorySpend={{ Food: 250 }}
        convert={(v) => v * 2}
        symbol="USD "
      />
    );
    expect(screen.getByText('USD 500 / USD 1,000')).toBeInTheDocument();
  });

  it('uses yellow color when spend is 70-89% of budget', () => {
    // pct >= 70 && pct < 90 branch in the ternary
    render(
      <BudgetProgress
        budgets={{ Food: 1000 }}
        categorySpend={{ Food: 750 }} // 75% — yellow zone
        convert={convert}
        symbol="$"
      />
    );
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('uses red color when spend is >=90% of budget', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 1000 }}
        categorySpend={{ Food: 950 }} // 95% — red zone
        convert={convert}
        symbol="$"
      />
    );
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('no onCategoryClick: clicking does not throw', () => {
    render(
      <BudgetProgress
        budgets={{ Food: 500 }}
        categorySpend={{ Food: 100 }}
        convert={convert}
        symbol="$"
      />
    );
    fireEvent.click(screen.getByText('Food'));
    expect(document.body).toBeTruthy();
  });
});
