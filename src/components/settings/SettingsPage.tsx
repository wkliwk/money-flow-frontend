import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Collapse,
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
  CircularProgress,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTheme } from '@mui/material/styles';
import { clearToken } from '../../services/auth';
import { useFxRates, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../hooks/useFxRates';
import { useCurrencyPreferences } from '../../hooks/useCurrencyPreferences';
import { useBudgets, BUDGET_CATEGORIES } from '../../hooks/useBudgets';
import FriendsSection from './FriendsSection';
import { useItemPresets } from '../../hooks/useItemPresets';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { useThemePreference } from '../../ThemeContext';
import { ThemePreference } from '../../theme';
import { exportJSON, getUserMe, changePassword, UserProfile } from '../../services/api';
import { AxiosError } from 'axios';
import { emitToast } from '../../toastEvents';

interface Props {
  currency: string;
  onCurrencyChange: (c: Currency) => void;
  categorySpend?: Record<string, number>;
}

function getUserId(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
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
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Appearance
        </Typography>
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
    </Box>
  );
};

const ChangePasswordSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newTooShort = newPassword.length > 0 && newPassword.length < 6;
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !loading;

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setError('');
  }, []);

  const handleToggle = () => {
    if (open) resetForm();
    setOpen((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await changePassword(currentPassword, newPassword);
      emitToast('Password updated', 'success');
      resetForm();
      setOpen(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
      const msg =
        axiosErr.response?.data?.error ||
        axiosErr.response?.data?.message ||
        'Failed to update password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Security
        </Typography>
        <Button
          variant="outlined"
          startIcon={<LockIcon />}
          onClick={handleToggle}
          fullWidth
          aria-expanded={open}
          aria-controls="change-password-form"
        >
          Change Password
        </Button>
        <Collapse in={open}>
          <Box
            id="change-password-form"
            component="form"
            onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}
            sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {error && (
              <Alert severity="error" sx={{ fontSize: '0.82rem' }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              size="small"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCurrent((s) => !s)}
                      aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                      edge="end"
                    >
                      {showCurrent ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="New Password"
              type={showNew ? 'text' : 'password'}
              size="small"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              error={newTooShort}
              helperText={newTooShort ? 'Must be at least 6 characters' : undefined}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNew((s) => !s)}
                      aria-label={showNew ? 'Hide new password' : 'Show new password'}
                      edge="end"
                    >
                      {showNew ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              size="small"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={confirmMismatch}
              helperText={confirmMismatch ? 'Passwords do not match' : undefined}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              fullWidth
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const SettingsPage: React.FC<Props> = ({ currency, onCurrencyChange, categorySpend = {} }) => {
  const theme = useTheme();
  const userId = getUserId();
  const { symbol, convert } = useFxRates();
  const { enabledCurrencies, toggleCurrency, isEnabled } = useCurrencyPreferences();
  const { budgets, setBudget } = useBudgets();
  const { presets, setPreset, deletePreset } = useItemPresets();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, budgets[c] ? String(budgets[c]) : '']))
  );
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState('');
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserMe()
      .then((data) => {
        const profile = (data as { user?: UserProfile }).user || data;
        setUserProfile(profile as UserProfile);
      })
      .catch(() => {});
  }, []);

  const isSocialOnly = Boolean(userProfile && (userProfile.googleId || userProfile.appleId));

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

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const confirmLogout = () => {
    setSignOutConfirm(false);
    handleLogout();
  };

  const handleExportJSON = async () => {
    setExportLoading(true);
    try {
      const blob = await exportJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `money-flow-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
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
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Settings</Typography>

      {/* Theme */}
      <ThemeToggle />

      {/* Display Currency */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
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
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Account
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'monospace' }}>{userId || '\u2014'}</Typography>
        </Box>
      </Box>

      {/* My Currencies */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            My Currencies
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
            Choose which currencies appear in the currency picker.
          </Typography>
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
      </Box>

      {/* Monthly Budgets */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Monthly Budgets
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
            Set limits per category — progress bars appear on the Home breakdown.
          </Typography>
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
                      {symbol}{Math.round(convert(spent)).toLocaleString()} this month{over ? ' \u2014 over!' : ''}
                    </Typography>
                  )}
                </Box>
                <TextField
                  size="small"
                  type="number"
                  placeholder="No limit"
                  value={drafts[cat]}
                  onChange={(e) => setDrafts((d) => ({ ...d, [cat]: e.target.value }))}
                  onBlur={() => handleBudgetBlur(cat)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>HK$</Typography></InputAdornment> }}
                  sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                  inputProps={{ min: 0 }}
                />
              </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Friends */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <FriendsSection />
        </Box>
      </Box>

      {/* Item Presets */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Item Presets
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
          Set a default description for each item type — auto-filled when you pick that item in the add form.
        </Typography>
        {renderItemSection('Expense Items', ITEM_PRESETS.filter((p) => p.type === 'expense'))}
        {renderItemSection('Income Items', ITEM_PRESETS.filter((p) => p.type === 'income'))}
      </Box>

      {/* Security — only for email/password users */}
      {!isSocialOnly && <ChangePasswordSection />}

      {/* Your Data */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Your Data
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
            Download a complete copy of all your data as a JSON file.
          </Typography>
          <Button
            variant="outlined"
            startIcon={exportLoading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportJSON}
            disabled={exportLoading}
            fullWidth
            aria-label="Download all data as JSON"
          >
            {exportLoading ? 'Exporting...' : 'Download All Data'}
          </Button>
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={() => setSignOutConfirm(true)}
        fullWidth
      >
        Sign Out
      </Button>

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
    </Box>
  );
};

export default SettingsPage;
