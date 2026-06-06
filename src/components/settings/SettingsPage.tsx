import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  SvgIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { useTheme } from '@mui/material/styles';
import { clearToken } from '../../services/auth';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useCurrencyPreferences } from '../../hooks/useCurrencyPreferences';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import ContactsSection from './ContactsSection';
import StatementReconciler from './StatementReconciler';
import { useItemPresets } from '../../hooks/useItemPresets';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { useThemePreference } from '../../ThemeContext';
import { ThemePreference } from '../../theme';
import { useTags } from '../../hooks/useTags';
import SettingsSection from './SettingsSection';
import SettingsProfile from './SettingsProfile';
import EmptyState from '../ui/EmptyState';

interface Props {
  currency: string;
  onCurrencyChange: (c: Currency) => void;
  categorySpend?: Record<string, number>;
  onTransactionsImported?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  onDeleteAllTransactions?: () => Promise<void>;
}

function getUserId(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch { return ''; }
}

function getUserEmail(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).email || '';
  } catch { return ''; }
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <LightModeIcon sx={{ fontSize: 16 }} /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessIcon sx={{ fontSize: 16 }} /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon sx={{ fontSize: 16 }} /> },
];

const ThemeToggle: React.FC = () => {
  const { preference, setPreference } = useThemePreference();
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <ToggleButtonGroup
        value={preference}
        exclusive
        onChange={(_, val: ThemePreference | null) => { if (val) setPreference(val); }}
        fullWidth
        aria-label="Theme preference"
      >
        {THEME_OPTIONS.map((opt) => (
          <ToggleButton key={opt.value} value={opt.value} aria-label={opt.label} sx={{ gap: 0.5 }}>
            {opt.icon}
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

const SettingsPage: React.FC<Props> = ({
  currency,
  onCurrencyChange,
  categorySpend = {},
  onTransactionsImported,
  onExportCsv,
  onExportJson,
  onDeleteAllTransactions,
}) => {
  const theme = useTheme();
  const userId = getUserId();
  const userEmail = getUserEmail();
  const { symbol, convert } = useFxRates();
  const { enabledCurrencies, toggleCurrency, isEnabled } = useCurrencyPreferences();
  const { budgets, setBudget } = useBudgets();
  const { presets, setPreset, deletePreset } = useItemPresets();
  const { tags, renameTag, recolorTag, removeTag } = useTags();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : '']))
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagNameDraft, setTagNameDraft] = useState('');
  const [tagDeleteConfirm, setTagDeleteConfirm] = useState<string | null>(null);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState('');
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const hasAnyBudget = Object.values(budgets).some((limit) => limit > 0);
  const budgetInputId = (category: string) => `budget-input-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const handleBudgetBlur = (category: string) => {
    const val = parseFloat(drafts[category]);
    setBudget(category, isNaN(val) ? 0 : val);
  };

  const startEditItem = (label: string) => {
    setEditingItem(label);
    setItemDraft(presets[label] || '');
  };

  const saveItem = () => {
    if (editingItem) {
      if (itemDraft.trim()) setPreset(editingItem, itemDraft.trim());
      else deletePreset(editingItem);
      setEditingItem(null);
    }
  };

  const startEditTag = (id: string, currentName: string) => {
    setEditingTag(id);
    setTagNameDraft(currentName);
  };

  const saveTagName = async () => {
    if (editingTag && tagNameDraft.trim()) {
      await renameTag(editingTag, tagNameDraft.trim());
    }
    setEditingTag(null);
  };

  const TAG_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#a78bfa', '#f87171', '#facc15'];

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const confirmLogout = () => {
    setSignOutConfirm(false);
    handleLogout();
  };

  const openDeleteAll = () => {
    setDeleteAllInput('');
    setDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    if (deleteAllInput !== 'DELETE') return;
    setDeleteAllLoading(true);
    try {
      await onDeleteAllTransactions?.();
    } finally {
      setDeleteAllLoading(false);
      setDeleteAllConfirm(false);
      setDeleteAllInput('');
    }
  };

  const renderItemSection = (label: string, items: typeof ITEM_PRESETS) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.65rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'block',
          mb: 1,
          px: 1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <Box key={item.label + item.type}>
            {idx > 0 && <Divider />}
            <Box sx={{ px: 2, py: 1.25 }}>
              {editingItem === item.label ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 60 }}>{item.label}</Typography>
                  <TextField
                    size="small"
                    autoFocus
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveItem();
                      if (e.key === 'Escape') setEditingItem(null);
                    }}
                    placeholder={`Default description for ${item.label}`}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                  />
                  <IconButton size="small" onClick={saveItem} sx={{ color: theme.palette.success.light }}>
                    <CheckIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingItem(null)} sx={{ color: 'text.disabled' }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: presets[item.label] ? 'text.secondary' : 'text.disabled' }}>
                      {presets[item.label] || 'No default set'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => startEditItem(item.label)}
                    sx={{ color: 'text.disabled', '&:hover': { color: theme.palette.primary.main } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {presets[item.label] && (
                    <IconButton
                      size="small"
                      onClick={() => deletePreset(item.label)}
                      sx={{ color: theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.5)', '&:hover': { color: theme.palette.error.light } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography
        component="h1"
        sx={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          mb: 2.5,
        }}
      >
        Settings
      </Typography>

      <SettingsProfile email={userEmail} userId={userId} />

      <SettingsSection title="Appearance">
        <ThemeToggle />
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1 }}>
            Display Currency
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {CURRENCIES.map((c) => (
              <Chip
                key={c}
                label={`${CURRENCY_SYMBOLS[c]} ${c}`}
                size="small"
                clickable
                onClick={() => onCurrencyChange(c as Currency)}
                sx={{
                  fontSize: '0.72rem', height: 28,
                  bgcolor: currency === c ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)') : 'action.hover',
                  color: currency === c ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: currency === c ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)') : 'divider',
                  fontWeight: currency === c ? 700 : 400,
                }}
              />
            ))}
          </Box>
        </Box>
      </SettingsSection>

      <SettingsSection title="Data">
        {(onExportCsv || onExportJson) && (
          <>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1.5 }}>
              {onExportCsv && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TableChartIcon sx={{ fontSize: 16 }} />}
                  onClick={onExportCsv}
                  sx={{ flex: 1, fontSize: '0.78rem' }}
                >
                  Export CSV
                </Button>
              )}
              {onExportJson && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DataObjectIcon sx={{ fontSize: 16 }} />}
                  onClick={onExportJson}
                  sx={{ flex: 1, fontSize: '0.78rem' }}
                >
                  Export JSON
                </Button>
              )}
            </Box>
            <Divider />
          </>
        )}
        <Box sx={{ px: 2, py: 1.5 }}>
          <StatementReconciler onImported={onTransactionsImported} />
        </Box>
      </SettingsSection>

      <SettingsSection title="My Currencies" description="Choose which currencies appear in the currency picker.">
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {CURRENCIES.map((c) => {
              const enabled = isEnabled(c);
              const isLastEnabled = enabled && enabledCurrencies.length === 1;
              return (
                <Chip
                  key={c}
                  label={`${CURRENCY_SYMBOLS[c]} ${c}`}
                  size="small"
                  clickable={!isLastEnabled}
                  onClick={() => { if (!isLastEnabled) toggleCurrency(c); }}
                  aria-pressed={enabled}
                  aria-disabled={isLastEnabled}
                  sx={{
                    fontSize: '0.72rem', height: 28,
                    bgcolor: enabled ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.12)') : 'action.hover',
                    color: enabled ? 'primary.main' : 'text.secondary',
                    border: '1px solid',
                    borderColor: enabled ? (theme.palette.mode === 'dark' ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.3)') : 'divider',
                    fontWeight: enabled ? 700 : 400,
                    opacity: isLastEnabled ? 0.5 : 1,
                    cursor: isLastEnabled ? 'default' : 'pointer',
                  }}
                />
              );
            })}
          </Box>
          {enabledCurrencies.length === 1 && (
            <Typography sx={{ fontSize: '0.68rem', color: 'warning.main', mt: 1 }}>
              At least one currency must remain enabled.
            </Typography>
          )}
        </Box>
      </SettingsSection>

      <SettingsSection
        title="Monthly Budgets"
        description="Set limits per category — progress bars appear on the Home breakdown."
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ display: 'none' }}>
            Set limits per category — progress bars appear on the Home breakdown.
          </Typography>
          {!hasAnyBudget && (
            <Box sx={{ mb: 2 }}>
              <EmptyState
                title="No budgets yet"
                body="Set limits per category to track progress on the Home breakdown."
                cta={{
                  label: 'Create your first budget',
                  onClick: () => {
                    const firstInput = document.getElementById(budgetInputId(BUDGET_CATEGORIES[0])) as HTMLInputElement | null;
                    firstInput?.focus();
                  },
                }}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {BUDGET_CATEGORIES.map((cat) => {
              const spent = categorySpend[cat] || 0;
              const budget = budgets[cat];
              const over = budget && spent > budget;
              return (
              <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{cat}</Typography>
                  {spent > 0 && (
                    <Typography sx={{ fontSize: '0.65rem', color: over ? 'error.main' : 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {symbol}{Math.round(convert(spent)).toLocaleString()} this month{over ? ' — over!' : ''}
                    </Typography>
                  )}
                </Box>
                <TextField
                  size="small"
                  type="number"
                  placeholder="No limit"
                  inputProps={{ min: 0, id: budgetInputId(cat) }}
                  value={drafts[cat]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                  onBlur={() => handleBudgetBlur(cat)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>HK$</Typography></InputAdornment> }}
                  sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                />
              </Box>
              );
            })}
          </Box>
        </Box>
      </SettingsSection>

      <SettingsSection title="Contacts">
        <Box sx={{ px: 2, py: 1.5 }}>
          <ContactsSection />
        </Box>
      </SettingsSection>

      <SettingsSection
        title="Tags"
        description="Rename or delete tags. Create tags directly in the transaction form."
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          {tags.length === 0 && (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>No tags yet</Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {tags.map((tag) => (
              <Box key={tag._id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                {editingTag === tag._id ? (
                  <>
                    <TextField
                      size="small"
                      autoFocus
                      value={tagNameDraft}
                      onChange={(e) => setTagNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTagName();
                        if (e.key === 'Escape') setEditingTag(null);
                      }}
                      sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.375, flexWrap: 'wrap', maxWidth: 160 }}>
                      {TAG_COLORS.map((c) => (
                        <Box
                          key={c}
                          onClick={() => recolorTag(tag._id, c)}
                          sx={{
                            width: 16, height: 16, borderRadius: '50%', bgcolor: c, cursor: 'pointer', flexShrink: 0,
                            border: tag.color === c ? '2px solid white' : '2px solid transparent',
                            boxShadow: tag.color === c ? `0 0 0 1px ${c}` : 'none',
                          }}
                        />
                      ))}
                    </Box>
                    <IconButton size="small" onClick={saveTagName} sx={{ color: theme.palette.success.light }}>
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setEditingTag(null)} sx={{ color: 'text.disabled' }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        bgcolor: tag.color ?? 'rgba(148,163,184,0.4)',
                        border: '1px solid rgba(148,163,184,0.2)',
                      }}
                    />
                    <Typography sx={{ fontSize: '0.85rem', flex: 1 }}>{tag.name}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => startEditTag(tag._id, tag.name)}
                      sx={{ color: 'text.disabled', '&:hover': { color: theme.palette.primary.main } }}
                    >
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    {tagDeleteConfirm === tag._id ? (
                      <>
                        <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>Delete?</Typography>
                        <IconButton size="small" onClick={() => { removeTag(tag._id); setTagDeleteConfirm(null); }} sx={{ color: theme.palette.error.light }}>
                          <CheckIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => setTagDeleteConfirm(null)} sx={{ color: 'text.disabled' }}>
                          <CloseIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => setTagDeleteConfirm(tag._id)}
                        sx={{ color: theme.palette.mode === 'dark' ? 'rgba(251,113,133,0.4)' : 'rgba(244,63,94,0.5)', '&:hover': { color: theme.palette.error.light } }}
                      >
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </SettingsSection>

      <SettingsSection
        title="Item Presets"
        description="Set a default description for each item type — auto-filled when you pick that item in the add form."
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          {renderItemSection('Expense Items', ITEM_PRESETS.filter((p) => p.type === 'expense'))}
          {renderItemSection('Income Items', ITEM_PRESETS.filter((p) => p.type === 'income'))}
        </Box>
      </SettingsSection>

      <SettingsSection title="Account">
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setSignOutConfirm(true)}
            fullWidth
          >
            Sign Out
          </Button>
          {onDeleteAllTransactions && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={openDeleteAll}
              fullWidth
              sx={{ borderStyle: 'dashed' }}
            >
              Delete All Transactions
            </Button>
          )}
        </Box>
      </SettingsSection>

      <Dialog open={signOutConfirm} onClose={() => setSignOutConfirm(false)}>
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to sign out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignOutConfirm(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmLogout}>
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteAllConfirm} onClose={() => { if (!deleteAllLoading) setDeleteAllConfirm(false); }}>
        <DialogTitle>Delete All Transactions</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will permanently delete <strong>all</strong> your transactions. This action cannot be undone.
          </Typography>
          <Typography sx={{ mb: 1.5, fontSize: '0.85rem', color: 'text.secondary' }}>
            Type <strong>DELETE</strong> to confirm:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={deleteAllInput}
            onChange={(e) => setDeleteAllInput(e.target.value)}
            placeholder="DELETE"
            autoFocus
            inputProps={{ 'aria-label': 'Type DELETE to confirm' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllConfirm(false)} disabled={deleteAllLoading}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteAll}
            disabled={deleteAllInput !== 'DELETE' || deleteAllLoading}
          >
            {deleteAllLoading ? 'Deleting…' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
