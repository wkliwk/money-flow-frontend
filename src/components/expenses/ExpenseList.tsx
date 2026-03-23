import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  CardActionArea,
  CardContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Transaction } from '../../types';
import { ITEM_PRESETS } from './ItemPicker';

const ITEM_COLOR: Record<string, string> = {};
ITEM_PRESETS.forEach((p) => { ITEM_COLOR[p.label] = p.color; });

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  convert: (hkd: number) => number;
  symbol: string;
}

function getDateKey(dateStr: string | undefined, fallback?: string): string {
  const raw = dateStr || fallback;
  if (!raw) return 'Unknown';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toISOString().split('T')[0];
}

function formatGroupHeader(dateKey: string): string {
  if (dateKey === 'Unknown') return 'Unknown';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  const d = new Date(dateKey);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string | undefined, fallback?: string): string {
  const raw = dateStr || fallback;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmt(amount: number, convert: (n: number) => number, symbol: string) {
  return `${symbol}${convert(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const ExpenseList: React.FC<Props> = ({ transactions, onEdit, onDelete, onAdd, convert, symbol }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (confirmId) {
      onDelete(confirmId);
      setConfirmId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <AccountBalanceWalletIcon sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.4 }} />
        <Typography variant="h6" color="text.secondary" mt={2} fontWeight={600}>
          No transactions yet
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Tap the + button to record your first one
        </Typography>
      </Box>
    );
  }

  // Group transactions by date for mobile
  const grouped: { key: string; label: string; items: Transaction[] }[] = [];
  if (isMobile) {
    const map: Record<string, Transaction[]> = {};
    const order: string[] = [];
    transactions.forEach((t) => {
      const key = getDateKey(t.date, t.createdAt);
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(t);
    });
    order.forEach((key) => {
      grouped.push({ key, label: formatGroupHeader(key), items: map[key] });
    });
  }

  return (
    <>
      {isMobile ? (
        /* ── Mobile: date-grouped card list ── */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {grouped.map((group) => (
            <Box key={group.key} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
                  {(() => {
                    const dayExpenses = group.items.filter((t) => t.type === 'expense');
                    if (!dayExpenses.length) return null;
                    const total = dayExpenses.reduce((s, t) => s + t.amount, 0);
                    return `-${fmtAmt(total, convert, symbol)}`;
                  })()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map((t) => {
                  const itemColor = t.item ? ITEM_COLOR[t.item] : undefined;
                  const accentColor = itemColor || (t.type === 'income' ? '#34d399' : '#fb7185');
                  return (
                  <Card
                    key={t._id}
                    sx={{
                      border: '1px solid rgba(148,163,184,0.08)',
                      background: 'rgba(30,41,59,0.5)',
                      backdropFilter: 'blur(8px)',
                      borderLeft: `3px solid ${accentColor}44`,
                    }}
                  >
                    <CardActionArea onClick={() => onEdit(t)} sx={{ p: 0 }}>
                      <CardContent sx={{ p: '14px 16px', '&:last-child': { pb: '14px' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          {/* Left: title + participants */}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              fontWeight={600}
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                            >
                              {t.item || t.description}
                            </Typography>
                            {t.item && t.description && (
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', lineHeight: 1.2 }}>
                                {t.description}
                              </Typography>
                            )}
                            {t.participants && t.participants.length > 0 && (
                              <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.25, display: 'block' }}>
                                with {t.participants.join(', ')}
                              </Typography>
                            )}
                          </Box>

                          {/* Right: amount (tap card to edit/delete) */}
                          <Typography
                            fontWeight={700}
                            sx={{
                              color: t.type === 'income' ? '#34d399' : '#fb7185',
                              fontSize: '0.95rem',
                              letterSpacing: '-0.01em',
                              flexShrink: 0,
                            }}
                          >
                            {t.type === 'income' ? '+' : '-'}{fmtAmt(t.amount, convert, symbol)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        /* ── Desktop: table ── */
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>With</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.date, t.createdAt)}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.item ? `${t.item}${t.description ? ` · ${t.description}` : ''}` : t.description}
                </TableCell>
                <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.8rem' }}>
                  {t.participants && t.participants.length > 0 ? t.participants.join(', ') : '—'}
                </TableCell>
                <TableCell>
                  <Chip label={t.type === 'income' ? 'Income' : 'Expense'} color={t.type === 'income' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Typography color={t.type === 'income' ? 'success.main' : 'error.main'} fontWeight={600} sx={{ letterSpacing: '-0.01em' }}>
                    {t.type === 'income' ? '+' : '-'}{fmtAmt(t.amount, convert, symbol)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit(t)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setConfirmId(t._id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Delete transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExpenseList;
