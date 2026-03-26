/**
 * Extended NetWorthPage tests covering missing branches.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NetWorthPage from '../NetWorthPage';
import * as api from '../../../services/api';

jest.mock('../../../services/api', () => ({
  getNetWorth: jest.fn(),
  getLatestNetWorth: jest.fn(),
  createNetWorth: jest.fn(),
  deleteNetWorthSnapshot: jest.fn(),
}));

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  CartesianGrid: () => null,
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('NetWorthPage — extended coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getNetWorth.mockResolvedValue([]);
    mockedApi.getLatestNetWorth.mockResolvedValue(null);
  });

  it('shows "Update Net Worth" button when snapshots exist', async () => {
    mockedApi.getNetWorth.mockResolvedValue([
      { _id: 's1', date: '2026-03-01', assets: { cash: 5000, investments: 0, property: 0, other: 0 }, liabilities: { loans: 0, creditCardDebt: 0, other: 0 }, netWorth: 5000 },
    ]);
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Update Net Worth')).toBeInTheDocument(); });
  });

  it('shows negative net worth with minus sign', async () => {
    mockedApi.getLatestNetWorth.mockResolvedValue({
      _id: 's2', date: '2026-03-01',
      assets: { cash: 1000, investments: 0, property: 0, other: 0 },
      liabilities: { loans: 5000, creditCardDebt: 0, other: 0 },
      netWorth: -4000,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('-$4,000')).toBeInTheDocument(); });
  });

  it('hides form when Cancel is clicked', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    expect(screen.getByLabelText(/Cash & Savings/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => { expect(screen.queryByLabelText(/Cash & Savings/)).not.toBeInTheDocument(); });
  });

  it('updates asset field values in form', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    const cashInput = screen.getByLabelText(/Cash & Savings/);
    fireEvent.change(cashInput, { target: { value: '50000' } });
    expect((cashInput as HTMLInputElement).value).toBe('50000');
  });

  it('updates liability field values in form', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    const loansInput = screen.getByLabelText(/Loans/);
    fireEvent.change(loansInput, { target: { value: '10000' } });
    expect((loansInput as HTMLInputElement).value).toBe('10000');
  });

  it('shows trend chart when 2+ snapshots exist', async () => {
    mockedApi.getNetWorth.mockResolvedValue([
      { _id: 's1', date: '2026-01-01', assets: { cash: 10000, investments: 0, property: 0, other: 0 }, liabilities: { loans: 0, creditCardDebt: 0, other: 0 }, netWorth: 10000 },
      { _id: 's2', date: '2026-02-01', assets: { cash: 12000, investments: 0, property: 0, other: 0 }, liabilities: { loans: 0, creditCardDebt: 0, other: 0 }, netWorth: 12000 },
    ]);
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByTestId('line-chart')).toBeInTheDocument(); });
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('does not show trend chart with fewer than 2 snapshots', async () => {
    mockedApi.getNetWorth.mockResolvedValue([
      { _id: 's1', date: '2026-01-01', assets: { cash: 10000, investments: 0, property: 0, other: 0 }, liabilities: { loans: 0, creditCardDebt: 0, other: 0 }, netWorth: 10000 },
    ]);
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.queryByText('Update Net Worth')).toBeInTheDocument(); });
    expect(screen.queryByText('Trend')).not.toBeInTheDocument();
  });

  it('shows liabilities breakdown when liabilities exist', async () => {
    mockedApi.getLatestNetWorth.mockResolvedValue({
      _id: 's1', date: '2026-03-01',
      assets: { cash: 0, investments: 0, property: 0, other: 0 },
      liabilities: { loans: 5000, creditCardDebt: 1000, other: 0 },
      netWorth: -6000,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Breakdown')).toBeInTheDocument(); });
    expect(screen.getByText('Loans')).toBeInTheDocument();
    expect(screen.getByText('Credit Card Debt')).toBeInTheDocument();
  });

  it('does not show breakdown when no assets or liabilities', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    expect(screen.queryByText('Breakdown')).not.toBeInTheDocument();
  });

  it('handles fetch error gracefully — shows UI without crashing', async () => {
    mockedApi.getNetWorth.mockRejectedValue(new Error('Network error'));
    mockedApi.getLatestNetWorth.mockRejectedValue(new Error('Network error'));
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
  });

  it('shows saving state while save is in progress', async () => {
    let resolveCreate: (value: any) => void;
    mockedApi.createNetWorth.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));

    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    fireEvent.click(screen.getByText('Save Snapshot'));
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await act(async () => {
      resolveCreate!({ _id: 'nw1', date: '2026-03-26', assets: { cash: 0, investments: 0, property: 0, other: 0 }, liabilities: { loans: 0, creditCardDebt: 0, other: 0 }, netWorth: 0 });
    });
  });

  it('handles save error gracefully without crashing', async () => {
    mockedApi.createNetWorth.mockRejectedValue(new Error('Save failed'));
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Add First Snapshot')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    await act(async () => { fireEvent.click(screen.getByText('Save Snapshot')); });
    await waitFor(() => { expect(screen.queryByText('Saving...')).not.toBeInTheDocument(); });
  });

  it('pre-populates form fields from latest snapshot', async () => {
    mockedApi.getNetWorth.mockResolvedValue([
      { _id: 's0', date: '2026-02-01', assets: { cash: 50000, investments: 20000, property: 0, other: 0 }, liabilities: { loans: 5000, creditCardDebt: 2000, other: 0 }, netWorth: 63000 },
    ]);
    mockedApi.getLatestNetWorth.mockResolvedValue({
      _id: 's1', date: '2026-03-01',
      assets: { cash: 50000, investments: 20000, property: 0, other: 0 },
      liabilities: { loans: 5000, creditCardDebt: 2000, other: 0 },
      netWorth: 63000,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => { expect(screen.getByText('Update Net Worth')).toBeInTheDocument(); });
    fireEvent.click(screen.getByText('Update Net Worth'));
    const cashInput = screen.getByLabelText(/Cash & Savings/) as HTMLInputElement;
    expect(cashInput.value).toBe('50000');
  });
});
