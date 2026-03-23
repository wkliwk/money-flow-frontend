import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types';
import { Currency } from '../../hooks/useFxRates';
import CurrencyPicker from './CurrencyPicker';

interface Props {
  transactions: Transaction[];
  selectedMonth: Dayjs | null;
  onChange: (month: Dayjs | null) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  convert: (amount: number) => number;
  symbol: string;
}

const fmt = (n: number) =>
  n.toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MobileHero: React.FC<Props> = ({
  transactions,
  selectedMonth,
  onChange,
  currency,
  onCurrencyChange,
  convert,
  symbol,
}) => {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;
  const isPositive = net >= 0;

  const handlePrev = () => onChange((selectedMonth ?? dayjs()).subtract(1, 'month'));
  const handleNext = () => onChange((selectedMonth ?? dayjs()).add(1, 'month'));

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 3,
        mb: 2,
        background: isPositive
          ? 'linear-gradient(135deg, rgba(129,140,248,0.18) 0%, rgba(52,211,153,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(251,113,133,0.18) 0%, rgba(251,113,133,0.06) 100%)',
        border: `1px solid ${isPositive ? 'rgba(129,140,248,0.25)' : 'rgba(251,113,133,0.25)'}`,
        boxShadow: `0 8px 32px ${isPositive ? 'rgba(129,140,248,0.1)' : 'rgba(251,113,133,0.1)'}`,
      }}
    >
      {/* Month navigator */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={handlePrev} sx={{ p: 1.5, color: 'text.secondary' }}>
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography
          variant="caption"
          fontWeight={600}
          onClick={() => selectedMonth ? onChange(null) : onChange(dayjs())}
          sx={{
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            color: 'text.secondary',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {selectedMonth ? selectedMonth.format('MMMM YYYY') : 'All Time'}
        </Typography>
        <IconButton size="small" onClick={handleNext} sx={{ p: 1.5, color: 'text.secondary' }}>
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Currency picker */}
      <Box sx={{ mb: 2 }}>
        <CurrencyPicker currency={currency} onChange={onCurrencyChange} />
      </Box>

      {/* Big balance */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'block',
            mb: 0.5,
          }}
        >
          Net Balance
        </Typography>
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            color: isPositive ? '#818cf8' : '#fb7185',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {isPositive ? '+' : '-'}{symbol}{fmt(convert(Math.abs(net)))}
        </Typography>
      </Box>

      {/* Income / Expense row */}
      <Divider sx={{ mb: 2, borderColor: 'rgba(148,163,184,0.1)' }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}
          >
            Income
          </Typography>
          <Typography fontWeight={700} sx={{ color: '#34d399', fontSize: '1rem', letterSpacing: '-0.01em' }}>
            +{symbol}{fmt(convert(income))}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(148,163,184,0.15)' }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}
          >
            Expenses
          </Typography>
          <Typography fontWeight={700} sx={{ color: '#fb7185', fontSize: '1rem', letterSpacing: '-0.01em' }}>
            -{symbol}{fmt(convert(expenses))}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileHero;
