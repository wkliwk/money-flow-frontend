import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Switch,
  FormControlLabel,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import { getBudgetSummary, setBudgetAlerts, BudgetSummaryItem } from '../../services/api';
import { PRESET_CATEGORIES } from '../expenses/CategorySelect';

interface Props {
  convert: (hkd: number) => number;
  symbol: string;
  categorySpend: Record<string, number>;
}

const fmt = (n: number, sym: string) =>
  `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Drink': '🍽️',
  'Transport': '🚌',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health': '🏥',
  'Utilities': '💡',
  'Rent': '🏠',
  'Education': '📚',
  'Other': '📦',
};

const BudgetsPage: React.FC<Props> = ({ convert, symbol, categorySpend }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { budgets, setBudget } = useBudgets();
  const [summary, setSummary] = useState<BudgetSummaryItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const [alertCategory, setAlertCategory] = useState<string | null>(null);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const allCategories = Array.from(
    new Set([...PRESET_CATEGORIES, ...BUDGET_CATEGORIES, ...Object.keys(categorySpend)])
  );
  const availableCategories = allCategories.filter((c) => !(c in budgets));

  const fetchSummary = useCallback(() => {
    getBudgetSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const entries = Object.entries(budgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const summaryItem = summary.find((s) => s.category === category);
      const spent = summaryItem?.spend ?? categorySpend[category] ?? 0;
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      return { category, limit, spent, pct, summaryItem };
    })
    .sort((a, b) => b.pct - a.pct);

  const handleAdd = () => {
    if (!newCategory || !newAmount || Number(newAmount) <= 0) return;
    setBudget(newCategory, Number(newAmount));
    setNewCategory('');
    setNewAmount('');
    setAddOpen(false);
    setTimeout(fetchSummary, 1000);
  };

  const handleEdit = () => {
    if (!editCategory || !editAmount || Number(editAmount) <= 0) return;
    setBudget(editCategory, Number(editAmount));
    setEditCategory(null);
    setEditAmount('');
    setTimeout(fetchSummary, 1000);
  };

  const handleDelete = () => {
    if (!deleteCategory) return;
    setBudget(deleteCategory, 0);
    setDeleteCategory(null);
    setTimeout(fetchSummary, 1000);
  };

  const handleAlertToggle = () => {
    if (!alertCategory) return;
    setBudgetAlerts(alertCategory, !alertEnabled).catch(() => {});
    setAlertEnabled((prev) => !prev);
  };

  const getColor = (pct: number) => {
    if (pct >= 90) return theme.palette.error.main;
    if (pct >= 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Budgets
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Budget
        </Button>
      </Box>

      {entries.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            No budgets yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Set monthly limits for your spending categories to stay on track
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Create Your First Budget
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 2,
        }}
      >
        {entries.map(({ category, limit, spent, pct, summaryItem }) => {
          const color = getColor(pct);
          const exceeds = spent > limit;
          const emoji = CATEGORY_EMOJI[category] || '';

          return (
            <Card
              key={category}
              sx={{
                position: 'relative',
                border: exceeds ? `1px solid ${theme.palette.error.main}` : undefined,
                background: exceeds
                  ? `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)'} 0%, transparent 100%)`
                  : undefined,
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {emoji && <Typography component="span" sx={{ fontSize: '1.2rem' }}>{emoji}</Typography>}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {category}
                      </Typography>
                      {exceeds && (
                        <Chip
                          label="Over budget"
                          size="small"
                          color="error"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setAlertCategory(category);
                        setAlertEnabled(summaryItem?.alertTriggered ?? false);
                      }}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 1, color: 'warning.main' } }}
                      aria-label={`Set alerts for ${category}`}
                    >
                      <NotificationsActiveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditCategory(category);
                        setEditAmount(String(limit));
                      }}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 1, color: 'primary.main' } }}
                      aria-label={`Edit ${category} budget`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteCategory(category)}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                      aria-label={`Delete ${category} budget`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: exceeds ? 'error.main' : 'text.primary' }}>
                      {fmt(convert(spent), symbol)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'flex-end' }}>
                      of {fmt(convert(limit), symbol)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: color,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {pct.toFixed(0)}% used
                  </Typography>
                  <Typography variant="caption" sx={{ color: exceeds ? 'error.main' : 'text.secondary', fontWeight: 600 }}>
                    {exceeds
                      ? `${fmt(convert(spent - limit), symbol)} over`
                      : `${fmt(convert(limit - spent), symbol)} remaining`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Add Budget Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>New Budget</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <Autocomplete
            freeSolo
            options={availableCategories}
            value={newCategory}
            onInputChange={(_, val) => setNewCategory(val)}
            renderInput={(params) => (
              <TextField {...params} label="Category" autoFocus fullWidth />
            )}
          />
          <TextField
            label="Monthly limit (HKD)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!newCategory || !newAmount || Number(newAmount) <= 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog
        open={!!editCategory}
        onClose={() => { setEditCategory(null); setEditAmount(''); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Budget — {editCategory}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            label="Monthly limit (HKD)"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            fullWidth
            autoFocus
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEditCategory(null); setEditAmount(''); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEdit}
            disabled={!editAmount || Number(editAmount) <= 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Remove the budget for <strong>{deleteCategory}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteCategory(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Settings Dialog */}
      <Dialog
        open={!!alertCategory}
        onClose={() => setAlertCategory(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Alert Settings — {alertCategory}</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <FormControlLabel
            control={
              <Switch checked={alertEnabled} onChange={handleAlertToggle} />
            }
            label="Enable alerts when budget is exceeded"
          />
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            You will be notified when spending in this category exceeds the budget limit.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAlertCategory(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetsPage;
