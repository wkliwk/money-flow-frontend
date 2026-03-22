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

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function getDateKey(dateStr: string | undefined, fallback?: string): string {
  const raw = dateStr || fallback;
  if (!raw) return 'Unknown';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
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

const ExpenseList: React.FC<Props> = ({ transactions, onEdit, onDelete, onAdd }) => {
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
              {/* Date header */}
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 1,
                  px: 0.5,
                }}
              >
                {group.label}
              </Typography>

              {/* Cards in group */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map((t) => (
                  <Card
                    key={t._id}
                    sx={{
                      border: '1px solid rgba(148,163,184,0.08)',
                      background: 'rgba(30,41,59,0.5)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <CardActionArea onClick={() => onEdit(t)} sx={{ p: 0 }}>
                      <CardContent sx={{ p: '14px 16px', '&:last-child': { pb: '14px' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          {/* Left: description + category */}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              fontWeight={600}
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                              }}
                            >
                              {t.description}
                            </Typography>
                            {t.category && (
                              <Chip
                                label={t.category}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  height: 18,
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(148,163,184,0.08)',
                                  color: 'text.secondary',
                                  border: '1px solid rgba(148,163,184,0.12)',
                                }}
                              />
                            )}
                          </Box>

                          {/* Right: amount + actions */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <Typography
                              fontWeight={700}
                              sx={{
                                color: t.type === 'income' ? '#34d399' : '#fb7185',
                                fontSize: '0.95rem',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {t.type === 'income' ? '+' : '-'}HK${t.amount.toLocaleString()}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setConfirmId(t._id); }}
                              sx={{ p: 0.5, color: 'rgba(148,163,184,0.4)', ml: 0.5 }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
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
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.date, t.createdAt)}</TableCell>
                <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.description}
                </TableCell>
                <TableCell>
                  <Chip label={t.type === 'income' ? 'Income' : 'Expense'} color={t.type === 'income' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Typography color={t.type === 'income' ? 'success.main' : 'error.main'} fontWeight={600} sx={{ letterSpacing: '-0.01em' }}>
                    {t.type === 'income' ? '+' : '-'}HK${t.amount.toLocaleString()}
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
