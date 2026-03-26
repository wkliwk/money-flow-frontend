import React, { useState } from 'react';
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import { TransactionType, PAYMENT_METHODS, PaymentMethod } from '../../types';

interface Props {
  search: string;
  typeFilter: TransactionType | 'all';
  paymentMethodFilter: PaymentMethod | 'all';
  sortBy: 'date' | 'amount';
  total: number;
  filtered: number;
  searchAllTime?: boolean;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: TransactionType | 'all') => void;
  onPaymentMethodFilterChange: (v: PaymentMethod | 'all') => void;
  onSortChange: (v: 'date' | 'amount') => void;
  onExport: () => void;
}

const FilterBar: React.FC<Props> = ({
  search,
  typeFilter,
  paymentMethodFilter,
  sortBy,
  total,
  filtered,
  searchAllTime,
  onSearchChange,
  onTypeFilterChange,
  onPaymentMethodFilterChange,
  onSortChange,
  onExport,
}) => {
  const [showPaymentFilter, setShowPaymentFilter] = useState(paymentMethodFilter !== 'all');
  const isActive = search !== '' || typeFilter !== 'all' || paymentMethodFilter !== 'all';

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 180 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <ToggleButtonGroup
          size="small"
          value={typeFilter}
          exclusive
          onChange={(_, val) => {
            if (val !== null) onTypeFilterChange(val);
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="income">Income</ToggleButton>
          <ToggleButton value="expense">Expense</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title="Filter by payment method">
          <IconButton
            size="small"
            onClick={() => {
              const next = !showPaymentFilter;
              setShowPaymentFilter(next);
              if (!next) onPaymentMethodFilterChange('all');
            }}
            sx={{
              color: paymentMethodFilter !== 'all' ? '#818cf8' : 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={sortBy === 'date' ? 'Sort by amount' : 'Sort by date'}>
          <IconButton
            size="small"
            onClick={() => onSortChange(sortBy === 'date' ? 'amount' : 'date')}
            sx={{ color: sortBy === 'amount' ? '#818cf8' : 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <SortIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={filtered === 0 ? 'No transactions to export' : 'Download CSV'}>
          <span>
            <IconButton
              size="small"
              onClick={onExport}
              disabled={filtered === 0}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Collapse in={showPaymentFilter}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
          <Chip
            label="All"
            size="small"
            clickable
            onClick={() => onPaymentMethodFilterChange('all')}
            sx={{
              fontSize: '0.72rem',
              height: 26,
              bgcolor: paymentMethodFilter === 'all' ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
              color: paymentMethodFilter === 'all' ? '#818cf8' : 'text.secondary',
              border: '1px solid',
              borderColor: paymentMethodFilter === 'all' ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
              fontWeight: paymentMethodFilter === 'all' ? 700 : 400,
            }}
          />
          {PAYMENT_METHODS.map((m) => (
            <Chip
              key={m}
              label={m}
              size="small"
              clickable
              onClick={() => onPaymentMethodFilterChange(paymentMethodFilter === m ? 'all' : m)}
              sx={{
                fontSize: '0.72rem',
                height: 26,
                bgcolor: paymentMethodFilter === m ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
                color: paymentMethodFilter === m ? '#818cf8' : 'text.secondary',
                border: '1px solid',
                borderColor: paymentMethodFilter === m ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
                fontWeight: paymentMethodFilter === m ? 700 : 400,
              }}
            />
          ))}
        </Box>
      </Collapse>
      {isActive && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Showing {filtered} of {total} transactions{searchAllTime ? ' · all time' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default FilterBar;
