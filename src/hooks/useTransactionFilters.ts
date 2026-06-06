import { useState, useMemo } from 'react';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { DatePreset } from '../components/dashboard/DateRangeControl';

export interface TransactionFilters {
  search: string;
  typeFilter: TransactionType | 'all';
  paymentMethodFilter: PaymentMethod | 'all';
  categoryFilter: string | 'all';
  tagFilter: string | 'all';
  sortBy: 'date' | 'amount';
  calendarFilterDate: string | null;
  datePreset: DatePreset;
  selectedMonth: Dayjs | null;
  customStart: string;
  customEnd: string;
  setSearch: (v: string) => void;
  setTypeFilter: (v: TransactionType | 'all') => void;
  setPaymentMethodFilter: (v: PaymentMethod | 'all') => void;
  setCategoryFilter: (v: string | 'all') => void;
  setTagFilter: (v: string | 'all') => void;
  setSortBy: (v: 'date' | 'amount') => void;
  setCalendarFilterDate: (v: string | null) => void;
  setDatePreset: (v: DatePreset) => void;
  setSelectedMonth: (v: Dayjs | null) => void;
  setCustomStart: (v: string) => void;
  setCustomEnd: (v: string) => void;
  handlePresetChange: (p: DatePreset) => void;
  handleCustomChange: (start: string, end: string) => void;
  monthFiltered: Transaction[];
  prevMonthFiltered: Transaction[];
  filteredTransactions: Transaction[];
  existingCategories: string[];
  streak: number;
  categorySpend: Record<string, number>;
}

export function useTransactionFilters(
  transactions: Transaction[],
  initialDatePreset: DatePreset,
  initialSelectedMonth: Dayjs | null
): TransactionFilters {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [calendarFilterDate, setCalendarFilterDate] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>(initialDatePreset);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(initialSelectedMonth);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetChange = (p: DatePreset) => {
    setDatePreset(p);
    localStorage.setItem('mf_date_preset', p);
    if (p === 'month' && !selectedMonth) setSelectedMonth(dayjs());
  };

  const handleCustomChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
  };

  const monthFiltered = useMemo(() => {
    if (datePreset === 'all-time') return transactions;
    if (datePreset === 'week') {
      const start = dayjs().startOf('week');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && !d.isBefore(start);
      });
    }
    if (datePreset === 'last-month') {
      const lm = dayjs().subtract(1, 'month');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && d.isSame(lm, 'month');
      });
    }
    if (datePreset === 'custom' && customStart && customEnd) {
      const start = dayjs(customStart).startOf('day');
      const end = dayjs(customEnd).endOf('day');
      return transactions.filter((t) => {
        const d = dayjs(t.date || t.createdAt);
        return d.isValid() && !d.isBefore(start) && !d.isAfter(end);
      });
    }
    if (!selectedMonth) return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(selectedMonth, 'month');
    });
  }, [transactions, datePreset, selectedMonth, customStart, customEnd]);

  const prevMonthFiltered = useMemo(() => {
    if (datePreset !== 'month' || !selectedMonth) return [];
    const prev = selectedMonth.subtract(1, 'month');
    return transactions.filter((t) => {
      const d = dayjs(t.date || t.createdAt);
      return d.isValid() && d.isSame(prev, 'month');
    });
  }, [transactions, datePreset, selectedMonth]);

  const streak = useMemo(() => {
    const days = new Set(transactions.map((t) => dayjs(t.date || t.createdAt).format('YYYY-MM-DD')));
    let count = 0;
    let cursor = dayjs();
    if (!days.has(cursor.format('YYYY-MM-DD'))) cursor = cursor.subtract(1, 'day');
    while (days.has(cursor.format('YYYY-MM-DD'))) {
      count++;
      cursor = cursor.subtract(1, 'day');
    }
    return count;
  }, [transactions]);

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    monthFiltered.filter((t) => t.type === 'expense').forEach((t) => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return map;
  }, [monthFiltered]);

  const filteredTransactions = useMemo(() => {
    const pool = search !== '' ? transactions : monthFiltered;
    const filtered = pool.filter((t) => {
      const searchLow = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        (t.description || '').toLowerCase().includes(searchLow) ||
        (t.item || '').toLowerCase().includes(searchLow) ||
        (t.category || '').toLowerCase().includes(searchLow) ||
        (t.participants || []).some((p) => p.toLowerCase().includes(searchLow)) ||
        (t.notes || '').toLowerCase().includes(searchLow) ||
        (t.tags || []).some((tag) => tag.name.toLowerCase().includes(searchLow));
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesPayment = paymentMethodFilter === 'all' || t.paymentMethod === paymentMethodFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesTag = tagFilter === 'all' || (t.tags || []).some((tag) => tag._id === tagFilter);
      const matchesCalendar = !calendarFilterDate || (t.date || '').slice(0, 10) === calendarFilterDate;
      return matchesSearch && matchesType && matchesPayment && matchesCategory && matchesTag && matchesCalendar;
    });
    if (sortBy === 'amount') {
      return [...filtered].sort((a, b) => b.amount - a.amount);
    }
    return filtered;
  }, [transactions, monthFiltered, search, typeFilter, paymentMethodFilter, categoryFilter, tagFilter, sortBy, calendarFilterDate]);

  const existingCategories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean) as string[])),
    [transactions]
  );

  return {
    search,
    typeFilter,
    paymentMethodFilter,
    categoryFilter,
    tagFilter,
    sortBy,
    calendarFilterDate,
    datePreset,
    selectedMonth,
    customStart,
    customEnd,
    setSearch,
    setTypeFilter,
    setPaymentMethodFilter,
    setCategoryFilter,
    setTagFilter,
    setSortBy,
    setCalendarFilterDate,
    setDatePreset,
    setSelectedMonth,
    setCustomStart,
    setCustomEnd,
    handlePresetChange,
    handleCustomChange,
    monthFiltered,
    prevMonthFiltered,
    filteredTransactions,
    existingCategories,
    streak,
    categorySpend,
  };
}
