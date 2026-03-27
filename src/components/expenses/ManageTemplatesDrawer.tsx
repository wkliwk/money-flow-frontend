import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { TransactionTemplate } from '../../hooks/useTemplates';
import { TransactionType } from '../../types';
import { PRESET_CATEGORIES } from './CategorySelect';
import { ITEM_PRESETS } from './ItemPicker';

interface Props {
  open: boolean;
  onClose: () => void;
  templates: TransactionTemplate[];
  onAdd: (t: Omit<TransactionTemplate, 'id'>) => void;
  onDelete: (id: string) => void;
}

const emptyForm = () => ({
  label: '',
  item: '',
  description: '',
  type: 'expense' as TransactionType,
  category: '',
  defaultAmount: '',
});

const ManageTemplatesDrawer: React.FC<Props> = ({ open, onClose, templates, onAdd, onDelete }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!form.label.trim() || !form.description.trim()) return;
    onAdd({
      label: form.label.trim(),
      item: form.item || undefined,
      description: form.description.trim(),
      type: form.type,
      category: form.category.trim(),
      defaultAmount: form.defaultAmount ? parseFloat(form.defaultAmount) : undefined,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const typeCards = [
    { value: 'expense' as TransactionType, label: 'Expense', icon: <TrendingDownIcon sx={{ fontSize: 18 }} />, color: theme.palette.error.light, activeBg: isDark ? 'rgba(251,113,133,0.15)' : 'rgba(244,63,94,0.18)', border: isDark ? 'rgba(251,113,133,0.3)' : 'rgba(244,63,94,0.38)' },
    { value: 'income' as TransactionType, label: 'Income', icon: <TrendingUpIcon sx={{ fontSize: 18 }} />, color: theme.palette.success.light, activeBg: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.18)', border: isDark ? 'rgba(52,211,153,0.3)' : 'rgba(16,185,129,0.38)' },
  ];

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '16px 16px 0 0', maxHeight: '85vh' } }}>
      <Box sx={{ p: 2.5, pb: 'calc(16px + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Templates</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Existing templates */}
        {templates.length > 0 && (
          <List disablePadding sx={{ mb: 2 }}>
            {templates.map((t, i) => (
              <React.Fragment key={t.id}>
                {i > 0 && <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)' }} />}
                <ListItem disableGutters sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>{t.label}</Typography>
                        <Chip
                          label={t.type === 'income' ? 'Income' : 'Expense'}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.62rem',
                            bgcolor: t.type === 'income'
                              ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(16,185,129,0.15)')
                              : (isDark ? 'rgba(251,113,133,0.12)' : 'rgba(244,63,94,0.15)'),
                            color: t.type === 'income' ? theme.palette.success.light : theme.palette.error.light,
                            border: 'none',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {t.description}{t.category ? ` · ${t.category}` : ''}{t.defaultAmount ? ` · HK$${t.defaultAmount}` : ''}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => onDelete(t.id)} sx={{ color: isDark ? 'rgba(251,113,133,0.5)' : 'rgba(244,63,94,0.5)', '&:hover': { color: theme.palette.error.light } }}>
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Add new template */}
        {!showForm ? (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setShowForm(true)}
            sx={{ borderStyle: 'dashed', borderColor: 'rgba(148,163,184,0.2)', color: 'text.secondary', borderRadius: 2 }}
          >
            + New Template
          </Button>
        ) : (
          <Box sx={{ bgcolor: 'rgba(148,163,184,0.04)', borderRadius: 2, p: 2, border: '1px solid rgba(148,163,184,0.1)' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
              New Template
            </Typography>

            {/* Type */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              {typeCards.map((card) => {
                const sel = form.type === card.value;
                return (
                  <Box
                    key={card.value}
                    onClick={() => setForm((f) => ({ ...f, type: card.value }))}
                    sx={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                      py: 1, borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
                      borderColor: sel ? card.border : 'rgba(148,163,184,0.1)',
                      bgcolor: sel ? card.activeBg : 'transparent',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: sel ? card.color : 'text.secondary', fontSize: '0.75rem' }}>
                      {card.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Item quick pick */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {ITEM_PRESETS.filter((p) => p.type === form.type).map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  size="small"
                  clickable
                  onClick={() => setForm((f) => ({ ...f, item: f.item === p.label ? '' : p.label, category: p.category }))}
                  sx={{
                    fontSize: '0.7rem', height: 24,
                    bgcolor: form.item === p.label ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.06)',
                    color: form.item === p.label ? theme.palette.primary.main : 'text.disabled',
                    border: '1px solid',
                    borderColor: form.item === p.label ? (isDark ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.44)') : 'rgba(148,163,184,0.1)',
                  }}
                />
              ))}
            </Box>

            <TextField label="Chip label" placeholder='e.g. "Lunch"' size="small" fullWidth value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} sx={{ mb: 1 }} />
            <TextField label="Description" placeholder='e.g. "Lunch at office"' size="small" fullWidth value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} sx={{ mb: 1 }} />

            {/* Category quick pick */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {PRESET_CATEGORIES.slice(0, 6).map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  clickable
                  onClick={() => setForm((f) => ({ ...f, category: f.category === cat ? '' : cat }))}
                  sx={{
                    fontSize: '0.68rem', height: 22,
                    bgcolor: form.category === cat ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.06)',
                    color: form.category === cat ? theme.palette.primary.main : 'text.disabled',
                    border: '1px solid',
                    borderColor: form.category === cat ? (isDark ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.44)') : 'rgba(148,163,184,0.1)',
                  }}
                />
              ))}
            </Box>

            <TextField label="Default amount (optional)" type="number" size="small" fullWidth value={form.defaultAmount} onChange={(e) => setForm((f) => ({ ...f, defaultAmount: e.target.value }))} sx={{ mb: 1.5 }} inputProps={{ min: 0 }} />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => { setShowForm(false); setForm(emptyForm()); }} sx={{ color: 'text.secondary' }}>Cancel</Button>
              <Button variant="contained" onClick={handleAdd} disabled={!form.label.trim() || !form.description.trim()} sx={{ flex: 1 }}>
                Save Template
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default ManageTemplatesDrawer;
