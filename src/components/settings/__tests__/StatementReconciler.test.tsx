import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatementReconciler from '../StatementReconciler';
import { scanStatement, applyStatementImport } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  scanStatement: jest.fn(),
  applyStatementImport: jest.fn(),
}));

describe('StatementReconciler', () => {
  const mockedScanStatement = scanStatement as jest.MockedFunction<
    typeof scanStatement
  >;
  const mockedApplyStatementImport = applyStatementImport as jest.MockedFunction<
    typeof applyStatementImport
  >;

  beforeEach(() => {
    mockedScanStatement.mockReset();
    mockedApplyStatementImport.mockReset();
  });

  it('imports selected missing transactions after scanning a statement', async () => {
    mockedScanStatement.mockResolvedValue({
      extracted: [
        {
          date: '2026-05-01',
          description: 'Coffee',
          amount: 12,
          type: 'expense',
        },
      ],
      matched: [
        {
          extracted: {
            date: '2026-05-01',
            description: 'Coffee',
            amount: 12,
            type: 'expense',
          },
          existingId: 'txn-1',
          existingDescription: 'Coffee',
        },
      ],
      missing: [
        {
          date: '2026-05-02',
          description: 'Lunch',
          amount: 42,
          type: 'expense',
        },
      ],
      discrepancies: [],
    });
    mockedApplyStatementImport.mockResolvedValue({ imported: 1 });
    const onImported = jest.fn();

    render(<StatementReconciler onImported={onImported} />);

    const file = new File(['statement'], 'statement.pdf', {
      type: 'application/pdf',
    });
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    await screen.findByText('1 matched');
    await screen.findByText('1 missing');
    await screen.findByRole('button', { name: 'Import 1 transaction' });

    fireEvent.click(screen.getByRole('button', { name: 'Import 1 transaction' }));

    await waitFor(() => {
      expect(mockedApplyStatementImport).toHaveBeenCalledWith([
        {
          date: '2026-05-02',
          description: 'Lunch',
          amount: 42,
          type: 'expense',
        },
      ]);
    });
    expect(onImported).toHaveBeenCalled();
  });
});
