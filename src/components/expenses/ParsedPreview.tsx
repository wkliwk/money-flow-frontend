import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { ParsedTransaction } from '../../services/api';

interface Props {
  parsed: ParsedTransaction;
  type: 'expense' | 'income';
  symbol: string;
  onEdit?: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Drink': '🍜',
  'Food & Dining': '🍜',
  'Food': '🍜',
  Transport: '🚇',
  Utilities: '💡',
  Bills: '💡',
  Shopping: '🛒',
  Groceries: '🛒',
  Education: '📚',
  Salary: '💼',
  Freelance: '💻',
  Investment: '📈',
  Property: '🏠',
  Other: '✨',
};

function emojiFor(category?: string): string {
  if (!category) return '✨';
  if (CATEGORY_EMOJI[category]) return CATEGORY_EMOJI[category];
  const lower = category.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase())) return emoji;
  }
  return '✨';
}

function formatDateLabel(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const dayStr = d.toISOString().slice(0, 10);
  if (dayStr === todayStr) return 'Today';
  if (dayStr === yesterdayStr) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Row {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}

const labelStyle = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontSize: '0.7rem',
  fontWeight: 500,
  color: '#A8A29E',
  width: 64,
  flexShrink: 0,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const valueStyle = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#1C1917',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
};

const valueBoldStyle = {
  ...valueStyle,
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '1.125rem',
  fontWeight: 700,
  letterSpacing: '-0.5px',
};

const ParsedPreview: React.FC<Props> = ({ parsed, type, symbol, onEdit }) => {
  const rows: Row[] = [];

  rows.push({
    label: 'Type',
    value: (
      <>
        {type === 'expense' ? (
          <TrendingDownIcon sx={{ fontSize: 14, color: '#DC2626' }} />
        ) : (
          <TrendingUpIcon sx={{ fontSize: 14, color: '#059669' }} />
        )}
        {type === 'expense' ? 'Expense' : 'Income'}
      </>
    ),
  });

  if (parsed.category) {
    rows.push({
      label: 'Item',
      value: (
        <>
          <span>{emojiFor(parsed.category)}</span>
          {parsed.category}
        </>
      ),
    });
  }

  if (typeof parsed.amount === 'number') {
    rows.push({
      label: 'Amount',
      value: `${symbol}${parsed.amount.toLocaleString()}`,
      bold: true,
    });
  }

  if (parsed.notes || parsed.merchant) {
    rows.push({
      label: 'Note',
      value: parsed.notes || parsed.merchant || '',
    });
  }

  if (parsed.participants && parsed.participants.length > 0) {
    rows.push({
      label: 'Person',
      value: parsed.participants.join(', '),
    });
  }

  const dateLabel = formatDateLabel(parsed.date);
  if (dateLabel) {
    rows.push({
      label: 'Date',
      value: dateLabel,
    });
  }

  if (!rows.length) return null;

  return (
    <Box
      data-testid="parsed-preview"
      sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: '#A8A29E',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          AI parsed
        </Typography>
        {onEdit && (
          <Box
            role="button"
            tabIndex={0}
            onClick={onEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onEdit();
            }}
            sx={{
              cursor: 'pointer',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '0.72rem',
              fontWeight: 500,
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Edit fields ↓
          </Box>
        )}
      </Box>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            borderRadius: '12px',
            bgcolor: '#FAF9F6',
            border: '1px solid #F0EDE7',
          }}
        >
          <Typography component="span" sx={labelStyle}>{row.label}</Typography>
          <Box sx={row.bold ? valueBoldStyle : valueStyle}>{row.value}</Box>
          <CheckIcon sx={{ fontSize: 14, color: '#059669', flexShrink: 0, ml: 1 }} />
        </Box>
      ))}
    </Box>
  );
};

export default ParsedPreview;
