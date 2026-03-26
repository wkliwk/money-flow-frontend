import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

// Mock useMediaQuery at module level to simulate mobile
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => true,
  };
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

const defaultProps = {
  transactions: [],
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('ExpenseList (mobile layout)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders mobile card for transaction', () => {
    const transactions = [makeTransaction({ description: 'Coffee' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('shows Today label for transactions dated today', () => {
    const transactions = [makeTransaction({ date: dayjs().format('YYYY-MM-DD') })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows Yesterday label for transactions dated yesterday', () => {
    const transactions = [makeTransaction({ date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('calls onEdit when mobile card is tapped', () => {
    const onEdit = jest.fn();
    const t = makeTransaction({ _id: 'tap1', description: 'Tap me' });
    render(<ExpenseList {...defaultProps} transactions={[t]} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Tap me'));
    expect(onEdit).toHaveBeenCalledWith(t);
  });

  it('shows expense amount with minus sign', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 100 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('-HK$100').length).toBeGreaterThan(0);
  });

  it('shows income amount with plus sign', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 200 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('+HK$200').length).toBeGreaterThan(0);
  });

  it('shows participants in mobile card', () => {
    const transactions = [makeTransaction({ participants: ['Alice', 'Bob'] })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(/with Alice, Bob/)).toBeInTheDocument();
  });

  it('shows daily expense total in group header', () => {
    const transactions = [
      makeTransaction({ amount: 150, type: 'expense' }),
    ];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('-HK$150').length).toBeGreaterThan(0);
  });

  it('shows item as primary label when item exists', () => {
    const transactions = [makeTransaction({ item: 'Food', description: 'Lunch' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows description below item when both exist and differ', () => {
    const transactions = [makeTransaction({ item: 'Food', description: 'Lunch special' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Lunch special')).toBeInTheDocument();
  });

  it('groups multiple transactions by date', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const transactions = [
      makeTransaction({ _id: '1', date: today, description: 'Today item' }),
      makeTransaction({ _id: '2', date: yesterday, description: 'Yesterday item' }),
    ];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Today item')).toBeInTheDocument();
    expect(screen.getByText('Yesterday item')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('shows formatted date label for past transactions (not today or yesterday)', () => {
    const pastDate = dayjs().subtract(14, 'day').format('YYYY-MM-DD');
    const transactions = [makeTransaction({ _id: 'past1', date: pastDate, description: 'Old lunch' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Old lunch')).toBeInTheDocument();
    // Group header should not be Today or Yesterday
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
  });

  it('shows note icon for mobile card when transaction has notes', () => {
    const transactions = [makeTransaction({ notes: 'Client reimbursement' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    const noteIcons = document.querySelectorAll('[data-testid="NotesIcon"]');
    expect(noteIcons.length).toBeGreaterThan(0);
  });

  it('shows tap to expand note text on mobile card with notes', () => {
    const transactions = [makeTransaction({ _id: 'n1', notes: 'Expense for project' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('tap to expand note')).toBeInTheDocument();
  });

  it('clicking notes section on mobile card toggles expanded state', () => {
    const transactions = [makeTransaction({ _id: 'n2', notes: 'Reimbursable expense' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    // Click the "tap to expand note" text — event bubbles to the Box onClick handler
    fireEvent.click(screen.getByText('tap to expand note'));
    // After click: expandedNote === t._id, so tap-to-expand hint is hidden
    expect(screen.queryByText('tap to expand note')).not.toBeInTheDocument();
  });
});

describe('ExpenseList (mobile swipe-to-delete)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate touch device
    Object.defineProperty(window, 'ontouchstart', { value: () => {}, writable: true, configurable: true });
  });

  afterEach(() => {
    // Clean up touch simulation
    // @ts-expect-error resetting touch simulation
    delete window.ontouchstart;
  });

  it('calls onDelete after swiping left past threshold', () => {
    const onDelete = jest.fn();
    const t = makeTransaction({ _id: 'swipe1', description: 'Swipe me' });
    const { container } = render(<ExpenseList {...defaultProps} transactions={[t]} onDelete={onDelete} />);
    const swipeEl = container.querySelector('[data-testid="swipeable-row"]') as HTMLElement;
    expect(swipeEl).not.toBeNull();

    fireEvent.touchStart(swipeEl, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(swipeEl, { touches: [{ clientX: 130 }] }); // -70px, past 60px threshold
    fireEvent.touchEnd(swipeEl);

    // Reveal state set — now click the delete button
    const deleteBtn = container.querySelector('[data-testid="delete-btn-swipe1"]') as HTMLElement;
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('swipe1');
  });

  it('does not call onDelete after partial swipe below threshold', () => {
    const onDelete = jest.fn();
    const t = makeTransaction({ _id: 'partial1', description: 'Partial swipe' });
    const { container } = render(<ExpenseList {...defaultProps} transactions={[t]} onDelete={onDelete} />);
    const swipeEl = container.querySelector('[data-testid="swipeable-row"]') as HTMLElement;

    fireEvent.touchStart(swipeEl, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(swipeEl, { touches: [{ clientX: 160 }] }); // -40px, below 60px threshold
    fireEvent.touchEnd(swipeEl);

    // onDelete should not have been called — delete button is not activated
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('swiping right resets position without calling onDelete', () => {
    const onDelete = jest.fn();
    const t = makeTransaction({ _id: 'right1', description: 'Right swipe' });
    const { container } = render(<ExpenseList {...defaultProps} transactions={[t]} onDelete={onDelete} />);
    const swipeEl = container.querySelector('[data-testid="swipeable-row"]') as HTMLElement;

    fireEvent.touchStart(swipeEl, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(swipeEl, { touches: [{ clientX: 150 }] }); // positive delta → right swipe
    fireEvent.touchEnd(swipeEl);

    expect(onDelete).not.toHaveBeenCalled();
  });
});
