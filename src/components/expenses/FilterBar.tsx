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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CircularProgress from '@mui/material/CircularProgress';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import LabelIcon from '@mui/icons-material/Label';
import { TransactionType, PAYMENT_METHODS, PaymentMethod } from '../../types';

interface Props {
  search: string;
  typeFilter: TransactionType | 'all';
  paymentMethodFilter: PaymentMethod | 'all';
  categoryFilter: string | 'all';
  categories: string[];
  sortBy: 'date' | 'amount';
  total: number;
  filtered: number;
  searchAllTime?: boolean;
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: TransactionType | 'all') => void;
  onPaymentMethodFilterChange: (v: PaymentMethod | 'all') => void;
  onCategoryFilterChange: (v: string | 'all') => void;
  onSortChange: (v: 'date' | 'amount') => void;
  onExport: () => void;
  onExportJson: () => void;
  onExportServerCsv?: () => void;
  onExportServerPdf?: () => void;
  exportLoading?: boolean;
}

const FilterBar: React.FC<Props> = ({
  search,
  typeFilter,
  paymentMethodFilter,
  categoryFilter,
  categories,
  sortBy,
  total,
  filtered,
  searchAllTime,
  onSearchChange,
  onTypeFilterChange,
  onPaymentMethodFilterChange,
  onCategoryFilterChange,
  onSortChange,
  onExport,
  onExportJson,
  onExportServerCsv,
  onExportServerPdf,
  exportLoading,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [showPaymentFilter, setShowPaymentFilter] = useState(paymentMethodFilter !== 'all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(categoryFilter !== 'all');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const isActive = search !== '' || typeFilter !== 'all' || paymentMethodFilter !== 'all' || categoryFilter !== 'all';

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
              color: paymentMethodFilter !== 'all' ? theme.palette.primary.main : 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {categories.length > 0 && (
          <Tooltip title="Filter by category">
            <IconButton
              size="small"
              aria-label="Filter by category"
              onClick={() => {
                const next = !showCategoryFilter;
                setShowCategoryFilter(next);
                if (!next) onCategoryFilterChange('all');
              }}
              sx={{
                color: categoryFilter !== 'all' ? theme.palette.primary.main : 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <LabelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={sortBy === 'date' ? 'Sort by amount' : 'Sort by date'}>
          <IconButton
            size="small"
            onClick={() => onSortChange(sortBy === 'date' ? 'amount' : 'date')}
            sx={{ color: sortBy === 'amount' ? theme.palette.primary.main : 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <SortIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={filtered === 0 ? 'No transactions to export' : exportLoading ? 'Exporting...' : 'Export'}>
          <span>
            <IconButton
              size="small"
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              disabled={filtered === 0 || exportLoading}
              aria-label="Export options"
              aria-haspopup="true"
              aria-expanded={Boolean(exportMenuAnchor)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            >
              {exportLoading ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            onClick={() => {
              setExportMenuAnchor(null);
              onExport();
            }}
            dense
          >
            <ListItemIcon>
              <TableChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export CSV</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setExportMenuAnchor(null);
              onExportJson();
            }}
            dense
          >
            <ListItemIcon>
              <DataObjectIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export JSON</ListItemText>
          </MenuItem>
          {onExportServerCsv && (
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                onExportServerCsv();
              }}
              disabled={exportLoading}
              dense
            >
              <ListItemIcon>
                {exportLoading ? <CircularProgress size={18} /> : <TableChartIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>Export CSV (Server)</ListItemText>
            </MenuItem>
          )}
          {onExportServerPdf && (
            <MenuItem
              onClick={() => {
                setExportMenuAnchor(null);
                onExportServerPdf();
              }}
              disabled={exportLoading}
              dense
            >
              <ListItemIcon>
                {exportLoading ? <CircularProgress size={18} /> : <PictureAsPdfIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>Export PDF</ListItemText>
            </MenuItem>
          )}
        </Menu>
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
              bgcolor: paymentMethodFilter === 'all' ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
              color: paymentMethodFilter === 'all' ? theme.palette.primary.main : 'text.secondary',
              border: '1px solid',
              borderColor: paymentMethodFilter === 'all' ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
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
                bgcolor: paymentMethodFilter === m ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
                color: paymentMethodFilter === m ? theme.palette.primary.main : 'text.secondary',
                border: '1px solid',
                borderColor: paymentMethodFilter === m ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
                fontWeight: paymentMethodFilter === m ? 700 : 400,
              }}
            />
          ))}
        </Box>
      </Collapse>
      <Collapse in={showCategoryFilter && categories.length > 0}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
          <Chip
            label="All"
            size="small"
            clickable
            onClick={() => onCategoryFilterChange('all')}
            sx={{
              fontSize: '0.72rem',
              height: 26,
              bgcolor: categoryFilter === 'all' ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
              color: categoryFilter === 'all' ? theme.palette.primary.main : 'text.secondary',
              border: '1px solid',
              borderColor: categoryFilter === 'all' ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
              fontWeight: categoryFilter === 'all' ? 700 : 400,
            }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              clickable
              onClick={() => onCategoryFilterChange(categoryFilter === cat ? 'all' : cat)}
              sx={{
                fontSize: '0.72rem',
                height: 26,
                bgcolor: categoryFilter === cat ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
                color: categoryFilter === cat ? theme.palette.primary.main : 'text.secondary',
                border: '1px solid',
                borderColor: categoryFilter === cat ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
                fontWeight: categoryFilter === cat ? 700 : 400,
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
