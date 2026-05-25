import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarStrip from '../CalendarStrip';
import type { Transaction } from '../../../types';
import dayjs from 'dayjs';

const TODAY = dayjs().format('YYYY-MM-DD');
const YESTERDAY = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const TWO_DAYS_AGO = dayjs().subtract(2, 'day').format('YYYY-MM-DD');

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  _id: Math.random().toString(36),
  owner: 'u',
  amount: 0,
  type: 'expense',
  date: TODAY,
  createdAt: TODAY,
  updatedAt: TODAY,
  ...over,
} as Transaction);

const renderStrip = (transactions: Transaction[], selectedDate: string | null = null) => {
  const onDayChange = jest.fn();
  render(
    <CalendarStrip
      transactions={transactions}
      selectedDate={selectedDate}
      onDayChange={onDayChange}
      symbol="HK$"
      convert={(n) => n}
    />
  );
  return { onDayChange };
};

describe('CalendarStrip', () => {
  it('renders 7 day cells', () => {
    renderStrip([]);
    expect(screen.getByTestId(`calendar-day-${TODAY}`)).toBeInTheDocument();
    // Total cells
    const cells = document.querySelectorAll('[data-testid^="calendar-day-"]');
    expect(cells.length).toBe(7);
  });

  it('renders the `days` prop count when overridden', () => {
    const onDayChange = jest.fn();
    render(
      <CalendarStrip transactions={[]} selectedDate={null} onDayChange={onDayChange} days={3} />
    );
    const cells = document.querySelectorAll('[data-testid^="calendar-day-"]');
    expect(cells.length).toBe(3);
  });

  it('marks the selected day with data-active and pressed', () => {
    renderStrip([], TODAY);
    const cell = screen.getByTestId(`calendar-day-${TODAY}`);
    expect(cell.getAttribute('data-active')).toBe('true');
    expect(cell.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not mark anything active when selectedDate is null', () => {
    renderStrip([]);
    const cells = document.querySelectorAll('[data-active="true"]');
    expect(cells.length).toBe(0);
  });

  it('calls onDayChange with iso date on first tap', () => {
    const { onDayChange } = renderStrip([]);
    fireEvent.click(screen.getByTestId(`calendar-day-${TODAY}`));
    expect(onDayChange).toHaveBeenCalledWith(TODAY);
  });

  it('calls onDayChange(null) when tapping the already-selected day (toggle off)', () => {
    const { onDayChange } = renderStrip([], TODAY);
    fireEvent.click(screen.getByTestId(`calendar-day-${TODAY}`));
    expect(onDayChange).toHaveBeenCalledWith(null);
  });

  it('scales bar height proportionally to daily spend', () => {
    renderStrip([
      tx({ amount: 100, date: TWO_DAYS_AGO }),
      tx({ amount: 50, date: YESTERDAY }),
      tx({ amount: 25, date: TODAY }),
    ]);
    const todayBar = screen.getByTestId(`calendar-bar-${TODAY}`).firstChild as HTMLElement;
    const yesterdayBar = screen.getByTestId(`calendar-bar-${YESTERDAY}`).firstChild as HTMLElement;
    const twoDaysBar = screen.getByTestId(`calendar-bar-${TWO_DAYS_AGO}`).firstChild as HTMLElement;
    // Style.height is set inline as a number; assert relative ordering via px
    const h = (el: HTMLElement) => parseFloat(el.style.height);
    expect(h(twoDaysBar)).toBeGreaterThan(h(yesterdayBar));
    expect(h(yesterdayBar)).toBeGreaterThan(h(todayBar));
  });

  it('ignores income transactions when computing bars', () => {
    renderStrip([
      tx({ amount: 9999, type: 'income', date: TODAY }),
    ]);
    const todayBar = screen.getByTestId(`calendar-bar-${TODAY}`).firstChild as HTMLElement;
    expect(parseFloat(todayBar.style.height)).toBe(0);
  });

  it('renders 0-height bars when there are no transactions', () => {
    renderStrip([]);
    const todayBar = screen.getByTestId(`calendar-bar-${TODAY}`).firstChild as HTMLElement;
    expect(parseFloat(todayBar.style.height)).toBe(0);
  });
});
