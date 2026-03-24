import React from 'react';
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import SortIcon from '@mui/icons-material/Sort';
import { TransactionType } from '../../types';

interface Props {
  search: string;
  typeFilter: TransactionType | 'all';
  sortBy: 'date' | 'amount';
  total: number;
  filtered: number;
  searchAllTime?: boolean;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: TransactionType | 'all') => void;
  onSortChange: (v: 'date' | 'amount') => void;
  onExport: () => void;
  bulkMode?: boolean;
  onBulkModeChange?: (enabled: boolean) => void;
}

const FilterBar: React.FC<Props> = ({
  search,
  typeFilter,
  sortBy,
  total,
  filtered,
  searchAllTime,
  onSearchChange,
  onTypeFilterChange,
  onSortChange,
  onExport,
  bulkMode = false,
  onBulkModeChange,
}) => {
  const isActive = search !== '' || typeFilter !== 'all';

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
        <Tooltip title={bulkMode ? 'Exit bulk select mode' : 'Enable bulk select'}>
          <IconButton
            size="small"
            onClick={() => onBulkModeChange?.(!bulkMode)}
            disabled={filtered === 0}
            sx={{
              color: bulkMode ? '#818cf8' : 'text.secondary',
              '&:hover': { color: bulkMode ? '#818cf8' : 'text.primary' },
            }}
          >
            ☑️
          </IconButton>
        </Tooltip>
      </Box>
      {isActive && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Showing {filtered} of {total} transactions{searchAllTime ? ' · all time' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default FilterBar;
