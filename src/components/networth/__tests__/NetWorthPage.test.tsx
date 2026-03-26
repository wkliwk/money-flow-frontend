import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  CartesianGrid: () => null,
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('NetWorthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getNetWorth.mockResolvedValue([]);
    mockedApi.getLatestNetWorth.mockResolvedValue(null);
  });

  it('shows loading state initially', () => {
    mockedApi.getNetWorth.mockReturnValue(new Promise(() => {}));
    mockedApi.getLatestNetWorth.mockReturnValue(new Promise(() => {}));
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows add first snapshot button when no data', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => {
      expect(screen.getByText('Add First Snapshot')).toBeInTheDocument();
    });
  });

  it('shows net worth summary when data exists', async () => {
    mockedApi.getLatestNetWorth.mockResolvedValue({
      _id: 's1',
      date: '2026-03-01',
      assets: { cash: 10000, investments: 5000, property: 0, other: 0 },
      liabilities: { loans: 3000, creditCardDebt: 500, other: 0 },
      netWorth: 11500,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => {
      expect(screen.getByText('$11,500')).toBeInTheDocument();
    });
    expect(screen.getByText('$15,000')).toBeInTheDocument(); // assets
    expect(screen.getByText('$3,500')).toBeInTheDocument(); // liabilities
  });

  it('shows update form when button clicked', async () => {
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => {
      expect(screen.getByText('Add First Snapshot')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    expect(screen.getByLabelText(/Cash & Savings/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loans/)).toBeInTheDocument();
  });

  it('saves snapshot and refreshes data', async () => {
    mockedApi.createNetWorth.mockResolvedValue({
      _id: 'new1',
      date: '2026-03-26',
      assets: { cash: 5000, investments: 0, property: 0, other: 0 },
      liabilities: { loans: 0, creditCardDebt: 0, other: 0 },
      netWorth: 5000,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => {
      expect(screen.getByText('Add First Snapshot')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Add First Snapshot'));
    fireEvent.click(screen.getByText('Save Snapshot'));
    await waitFor(() => {
      expect(mockedApi.createNetWorth).toHaveBeenCalled();
    });
  });

  it('shows breakdown when assets exist', async () => {
    mockedApi.getLatestNetWorth.mockResolvedValue({
      _id: 's1',
      date: '2026-03-01',
      assets: { cash: 10000, investments: 5000, property: 0, other: 0 },
      liabilities: { loans: 0, creditCardDebt: 0, other: 0 },
      netWorth: 15000,
    });
    render(<NetWorthPage convert={(v) => v} symbol="$" />);
    await waitFor(() => {
      expect(screen.getByText('Breakdown')).toBeInTheDocument();
    });
    expect(screen.getByText('Cash & Savings')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });
});
