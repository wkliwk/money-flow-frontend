import { useCallback, useEffect, useRef, useState } from 'react';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Transaction, TransactionRequest } from '../types';
import {
  createExpense,
  deleteExpense,
  getExpense,
  scanReceipt,
  getLastAmounts,
  ReceiptScanResult,
} from '../services/api';
import { ReceiptPrefill } from '../components/expenses/AddExpenseModal';
import { DatePreset } from '../components/dashboard/DateRangeControl';
import useToast from './useToast';

function getOwnerFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}

export interface TransactionHandlers {
  handleAdd: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  handleDelete: (id: string) => void;
  handleSaved: (updated: Transaction) => Promise<void>;
  handleDeleteAllTransactions: () => Promise<void>;
  handleExport: () => void;
  handleExportJson: () => void;
  handleScanReceipt: (file: File) => Promise<void>;
  scanLoading: boolean;
  receiptImageUrlRef: React.MutableRefObject<string | null>;
  recentItems: string[];
  knownParticipants: string[];
  descriptionsByItem: Record<string, string[]>;
  amountsByDescription: Record<string, number>;
  categoriesByDescription: Record<string, string>;
}

export interface TransactionHandlersOptions {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  filteredTransactions: Transaction[];
  contactNames: string[];
  search: string;
  datePreset: DatePreset;
  selectedMonth: Dayjs | null;
  customStart: string;
  customEnd: string;
  typeFilter: string;
  convert: (amount: number) => number;
  symbol: string;
  setAddReceiptOpen: (open: boolean) => void;
  setReceiptPrefill: (prefill: ReceiptPrefill | undefined) => void;
  setEditTransaction: (tx: Transaction | null) => void;
  showSnackbar: (message: string, severity?: 'success' | 'error') => void;
}

export function useTransactionHandlers(opts: TransactionHandlersOptions): TransactionHandlers {
  const {
    transactions,
    setTransactions,
    filteredTransactions,
    contactNames,
    search,
    datePreset,
    selectedMonth,
    customStart,
    customEnd,
    typeFilter,
    convert,
    symbol,
    setAddReceiptOpen,
    setReceiptPrefill,
    showSnackbar,
  } = opts;

  const toast = useToast();
  const pendingDelete = useRef<Transaction | null>(null);
  const receiptImageUrlRef = useRef<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [amountsByDescription, setAmountsByDescription] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const result = getLastAmounts();
      if (result && typeof result.then === 'function') {
        result.then(setAmountsByDescription).catch(() => {});
      }
    } catch {
      // Silently handle mock/test environments
    }
  }, [transactions.length]);

  const recentItems = (() => {
    const seen: string[] = [];
    [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => { if (t.item && !seen.includes(t.item)) seen.push(t.item); });
    return seen.slice(0, 5);
  })();

  const knownParticipants = (() => {
    const seen = new Set<string>(contactNames);
    transactions.forEach((t) => (t.participants ?? []).forEach((p) => seen.add(p)));
    return Array.from(seen).slice(0, 20);
  })();

  const descriptionsByItem = (() => {
    const map: Record<string, string[]> = {};
    transactions.forEach((t) => {
      const key = t.item || '';
      if (!key || !t.description?.trim()) return;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(t.description.trim())) map[key].push(t.description.trim());
    });
    return map;
  })();

  const categoriesByDescription = (() => {
    const map: Record<string, string> = {};
    [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .forEach((t) => {
        const key = (t.description?.trim() || t.item || '').toLowerCase();
        if (key && t.category && !map[key]) map[key] = t.category;
      });
    return map;
  })();

  const handleAdd = async (data: Omit<TransactionRequest, 'owner'>) => {
    const owner = getOwnerFromToken();
    const created = await createExpense({ ...data, owner });
    setTransactions((prev) => [created, ...prev]);
    if (receiptImageUrlRef.current) {
      URL.revokeObjectURL(receiptImageUrlRef.current);
      receiptImageUrlRef.current = null;
    }
    setReceiptPrefill(undefined);
    showSnackbar('Transaction added');
  };

  const handleScanReceipt = async (file: File) => {
    setScanLoading(true);
    const previewUrl = URL.createObjectURL(file);
    receiptImageUrlRef.current = previewUrl;
    try {
      const result: ReceiptScanResult = await scanReceipt(file);
      setReceiptPrefill({
        amount: result.amount,
        description: result.description || result.merchant || '',
        category: result.category,
        date: result.date,
        confidence: result.confidence,
        imagePreviewUrl: previewUrl,
      });
      setAddReceiptOpen(true);
    } catch {
      URL.revokeObjectURL(previewUrl);
      receiptImageUrlRef.current = null;
      showSnackbar('Could not read receipt — fill in manually', 'error');
      setReceiptPrefill(undefined);
      setAddReceiptOpen(true);
    } finally {
      setScanLoading(false);
    }
  };

  const commitDelete = useCallback(
    async (t: Transaction) => {
      try {
        await deleteExpense(t._id);
      } catch {
        setTransactions((prev) => [t, ...prev]);
        toast.error('Failed to delete transaction');
      }
    },
    [toast, setTransactions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const tx = transactions.find((t) => t._id === id);
      if (!tx) return;
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      pendingDelete.current = tx;
      const label = tx.item || tx.description || 'Transaction';
      const sign = tx.type === 'income' ? '+' : '-';
      const amount = `${symbol}${convert(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      const message = `Deleted "${label}" (${sign}${amount})`;
      toast.success(message, {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            if (pendingDelete.current?._id !== tx._id) return;
            pendingDelete.current = null;
            setTransactions((prev) =>
              [tx, ...prev].sort(
                (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
              )
            );
          },
        },
        onTimeout: () => {
          if (pendingDelete.current?._id !== tx._id) return;
          pendingDelete.current = null;
          commitDelete(tx);
        },
      });
    },
    [toast, commitDelete, symbol, convert, transactions, setTransactions]
  );

  const handleSaved = async (updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    showSnackbar('Transaction updated');
    try {
      const fresh = await getExpense(updated._id);
      setTransactions((prev) => prev.map((t) => (t._id === fresh._id ? fresh : t)));
    } catch {}
  };

  const handleDeleteAllTransactions = async () => {
    const ids = [...transactions].map((t) => t._id);
    await Promise.all(ids.map((id) => deleteExpense(id)));
    setTransactions([]);
  };

  const buildFileSuffix = () => {
    if (datePreset === 'month' && selectedMonth) return selectedMonth.format('YYYY-MM');
    if (datePreset === 'last-month') return dayjs().subtract(1, 'month').format('YYYY-MM');
    if (datePreset === 'week') return `week-${dayjs().startOf('week').format('YYYY-MM-DD')}`;
    if (datePreset === 'custom' && customStart) return `${customStart}_${customEnd}`;
    return 'all';
  };

  const handleExport = () => {
    const header = ['Date', 'Item', 'Description', 'Type', 'Category', 'Amount', 'Payment Method', 'Participants'];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date || t.createdAt).toISOString().split('T')[0],
      t.item ? `"${t.item.replace(/"/g, '""')}"` : '',
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.category ? `"${t.category.replace(/"/g, '""')}"` : '',
      t.amount,
      t.paymentMethod || '',
      t.participants?.length ? `"${t.participants.join(', ')}"` : '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = search ? 'money-flow-search.csv' : `money-flow-${buildFileSuffix()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      transactionCount: filteredTransactions.length,
      filters: {
        from: customStart || null,
        to: customEnd || null,
        type: typeFilter === 'all' ? null : typeFilter,
      },
      transactions: filteredTransactions,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = search ? 'money-flow-search.json' : `money-flow-${buildFileSuffix()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    handleAdd,
    handleDelete,
    handleSaved,
    handleDeleteAllTransactions,
    handleExport,
    handleExportJson,
    handleScanReceipt,
    scanLoading,
    receiptImageUrlRef,
    recentItems,
    knownParticipants,
    descriptionsByItem,
    amountsByDescription,
    categoriesByDescription,
  };
}
