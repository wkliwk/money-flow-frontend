import { useState, useCallback } from 'react';
import { Transaction } from '../types';
import { ReceiptPrefill } from '../components/expenses/AddExpenseModal';

export interface ModalState {
  addReceiptOpen: boolean;
  quickExpenseOpen: boolean;
  editTransaction: Transaction | null;
  setAddReceiptOpen: (open: boolean) => void;
  setQuickExpenseOpen: (open: boolean) => void;
  setEditTransaction: (tx: Transaction | null) => void;
  closeAddReceipt: () => void;
  receiptPrefill: ReceiptPrefill | undefined;
  setReceiptPrefill: (prefill: ReceiptPrefill | undefined) => void;
}

export function useModalState(
  receiptImageUrlRef: React.MutableRefObject<string | null>
): ModalState {
  const [addReceiptOpen, setAddReceiptOpen] = useState(false);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [receiptPrefill, setReceiptPrefill] = useState<ReceiptPrefill | undefined>(undefined);

  const closeAddReceipt = useCallback(() => {
    setAddReceiptOpen(false);
    if (receiptImageUrlRef.current) {
      URL.revokeObjectURL(receiptImageUrlRef.current);
      receiptImageUrlRef.current = null;
    }
    setReceiptPrefill(undefined);
  }, [receiptImageUrlRef]);

  return {
    addReceiptOpen,
    quickExpenseOpen,
    editTransaction,
    setAddReceiptOpen,
    setQuickExpenseOpen,
    setEditTransaction,
    closeAddReceipt,
    receiptPrefill,
    setReceiptPrefill,
  };
}
