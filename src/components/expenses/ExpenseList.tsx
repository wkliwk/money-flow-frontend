import React, { useState, useRef, useCallback } from 'react';
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
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Tooltip,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RepeatIcon from '@mui/icons-material/Repeat';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import GroupIcon from '@mui/icons-material/Group';
import EmptyState from '../EmptyState';
import PaymentIcon from '@mui/icons-material/Payment';
import NoteIcon from '@mui/icons-material/Notes';
import { Transaction, PAYMENT_METHOD_LABELS, PaymentMethod, Tag } from '../../types';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { CURRENCY_SYMBOLS, Currency } from '../../constants/currencies';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  convert: (hkd: number) => number;
  symbol: string;
  recurringLabels?: Set<string>;
  filtersActive?: boolean;
  onAddClick?: () => void;
  onRefresh?: () => Promise<void>;
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

function formatDateShort(dateStr: string | undefined, fallback?: string): string {
  const raw = dateStr || fallback;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  const isCurrentYear = d.getFullYear() === today.getFullYear();
  if (isCurrentYear) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TagChips({ tags }: { tags: Tag[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.375, mt: 0.375 }}>
      {tags.map((tag) => (
        <Chip
          key={tag._id}
          label={tag.name}
          size="small"
          icon={<LocalOfferIcon sx={{ fontSize: '10px !important', color: tag.color ? `${tag.color} !important` : undefined }} />}
          sx={{
            fontSize: '0.62rem',
            height: 18,
            px: 0,
            bgcolor: tag.color ? `${tag.color}22` : 'rgba(148,163,184,0.08)',
            color: tag.color ?? 'text.secondary',
            border: '1px solid',
            borderColor: tag.color ? `${tag.color}55` : 'rgba(148,163,184,0.15)',
            fontWeight: 500,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      ))}
    </Box>
  );
}

function fmtAmt(amount: number, convert: (n: number) => number, symbol: string) {
  return `${symbol}${convert(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtOriginal(t: Transaction): string | null {
  if (!t.currency || t.currency === 'HKD' || !t.originalAmount) return null;
  const sym = CURRENCY_SYMBOLS[t.currency as Currency] || t.currency;
  return `${sym}${t.originalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const SWIPE_REVEAL_PX = 80;
const SWIPE_THRESHOLD_PX = 60;

const PULL_THRESHOLD_PX = 65;
const PULL_MAX_PX = 80;
const PULL_DEBOUNCE_MS = 2000;

const ExpenseList: React.FC<Props> = ({ transactions, onEdit, onDelete, convert, symbol, recurringLabels, filtersActive, onAddClick, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});
  const touchStartX = useRef<Record<string, number>>({});
  const isSwiping = useRef<Record<string, boolean>>({});

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const isPullingRef = useRef(false);
  const pullYRef = useRef(0);
  const lastRefreshAt = useRef(0);

  const handlePullStart = useCallback((e: React.TouchEvent) => {
    if (!onRefresh || isRefreshing) return;
    pullStartY.current = e.touches[0].clientY;
    isPullingRef.current = false;
  }, [onRefresh, isRefreshing]);

  const handlePullMove = useCallback((e: React.TouchEvent) => {
    if (!onRefresh || isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 4) { isPullingRef.current = false; return; }
    const deltaY = e.touches[0].clientY - pullStartY.current;
    if (deltaY <= 0) {
      if (isPullingRef.current) {
        isPullingRef.current = false;
        setPullY(0);
        pullYRef.current = 0;
      }
      return;
    }
    isPullingRef.current = true;
    const clamped = Math.min(deltaY * 0.5, PULL_MAX_PX);
    pullYRef.current = clamped;
    setPullY(clamped);
  }, [onRefresh, isRefreshing]);

  const handlePullEnd = useCallback(async () => {
    if (!onRefresh || !isPullingRef.current) {
      setPullY(0);
      pullYRef.current = 0;
      return;
    }
    isPullingRef.current = false;
    const dist = pullYRef.current;
    setPullY(0);
    pullYRef.current = 0;
    if (dist >= PULL_THRESHOLD_PX) {
      const now = Date.now();
      if (now - lastRefreshAt.current < PULL_DEBOUNCE_MS) return;
      lastRefreshAt.current = now;
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    if (!('ontouchstart' in window)) return;
    touchStartX.current[id] = e.touches[0].clientX;
    isSwiping.current[id] = false;
  }, []);

  const handleTouchMove = useCallback((id: string, e: React.TouchEvent) => {
    if (!('ontouchstart' in window)) return;
    const startX = touchStartX.current[id];
    if (startX === undefined) return;
    const deltaX = e.touches[0].clientX - startX;
    if (deltaX > 0) {
      // Swiping right — reset
      setSwipeOffset((prev) => ({ ...prev, [id]: 0 }));
      setSwipedId(null);
      isSwiping.current[id] = false;
      return;
    }
    isSwiping.current[id] = true;
    const clamped = Math.max(deltaX, -SWIPE_REVEAL_PX);
    setSwipeOffset((prev) => ({ ...prev, [id]: clamped }));
  }, []);

  const handleTouchEnd = useCallback((id: string) => {
    if (!('ontouchstart' in window)) return;
    const offset = swipeOffset[id] ?? 0;
    if (Math.abs(offset) >= SWIPE_THRESHOLD_PX) {
      setSwipeOffset((prev) => ({ ...prev, [id]: -SWIPE_REVEAL_PX }));
      setSwipedId(id);
    } else {
      setSwipeOffset((prev) => ({ ...prev, [id]: 0 }));
      setSwipedId(null);
    }
    isSwiping.current[id] = false;
  }, [swipeOffset]);

  const handleDeleteTap = useCallback((id: string) => {
    setSwipeOffset((prev) => ({ ...prev, [id]: 0 }));
    setSwipedId(null);
    onDelete(id);
  }, [onDelete]);

  if (transactions.length === 0) {
    if (filtersActive) {
      return (
        <EmptyState
          heading="No results"
          subtext="Try adjusting your filters"
        />
      );
    }
    return (
      <EmptyState
        heading="No transactions yet"
        subtext="Tap + to record your first expense"
        ctaLabel="Add expense"
        onCta={onAddClick}
      />
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
        /* ── Mobile: date-grouped card list with pull-to-refresh ── */
        <Box
          data-testid="pull-refresh-container"
          onTouchStart={handlePullStart}
          onTouchMove={handlePullMove}
          onTouchEnd={handlePullEnd}
          sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {(pullY > 0 || isRefreshing) && (
            <Box
              data-testid="pull-refresh-indicator"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: isRefreshing ? 48 : pullY,
                opacity: isRefreshing ? 1 : Math.min(pullY / PULL_THRESHOLD_PX, 1),
                transition: pullY > 0 ? 'none' : 'height 0.2s ease, opacity 0.2s ease',
              }}
            >
              {isRefreshing ? (
                <CircularProgress size={22} />
              ) : (
                <CircularProgress
                  size={22}
                  variant="determinate"
                  value={Math.min((pullY / PULL_THRESHOLD_PX) * 100, 100)}
                />
              )}
            </Box>
          )}
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
                  const edgeColor = t.type === 'income' ? 'rgba(102,187,106,0.6)' : 'rgba(239,83,80,0.6)';
                  const isRecurring = recurringLabels && (
                    (t.item && recurringLabels.has(t.item)) ||
                    recurringLabels.has(t.description)
                  );
                  const offset = swipeOffset[t._id] ?? 0;
                  return (
                  <Box
                    key={t._id}
                    data-testid="swipeable-row"
                    sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1 }}
                    onTouchStart={(e) => handleTouchStart(t._id, e)}
                    onTouchMove={(e) => handleTouchMove(t._id, e)}
                    onTouchEnd={() => handleTouchEnd(t._id)}
                  >
                    {/* Red delete background revealed on swipe */}
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: SWIPE_REVEAL_PX,
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0 4px 4px 0',
                        visibility: offset < 0 ? 'visible' : 'hidden',
                      }}
                    >
                      <IconButton
                        aria-label={`Delete ${t.item || t.description}`}
                        data-testid={`delete-btn-${t._id}`}
                        onClick={() => handleDeleteTap(t._id)}
                        sx={{ color: '#fff', p: 1 }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Card
                      sx={{
                        width: '100%',
                        border: '1px solid rgba(148,163,184,0.08)',
                        background: theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.85)',
                        borderLeft: `4px solid ${edgeColor}`,
                        transform: `translateX(${offset}px)`,
                        transition: isSwiping.current[t._id] ? 'none' : 'transform 0.2s ease',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                    <CardActionArea
                      onClick={() => {
                        if (swipedId === t._id) {
                          setSwipedId(null);
                          setSwipeOffset((prev) => ({ ...prev, [t._id]: 0 }));
                          return;
                        }
                        onEdit(t);
                      }}
                      sx={{ p: 0 }}
                    >
                      <CardContent sx={{ p: '14px 16px', '&:last-child': { pb: t.notes ? '8px' : '14px' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          {/* Left: title + participants */}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography
                                fontWeight={600}
                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}
                              >
                                {t.item || t.description}
                              </Typography>
                              {isRecurring && (
                                <RepeatIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                              )}
                              {t.notes && (
                                <NoteIcon sx={{ fontSize: 13, color: isDark ? 'rgba(129,140,248,0.6)' : 'rgba(99,102,241,0.6)', flexShrink: 0 }} />
                              )}
                            </Box>
                            {t.item && t.description && t.description !== t.item && (
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.description}
                              </Typography>
                            )}
                            {t.tags && t.tags.length > 0 && <TagChips tags={t.tags} />}
                            {t.participants && t.participants.length > 0 && (() => {
                              const mode = typeof t.splitBill === 'string' ? t.splitBill : t.splitBill === true ? 'split' : 'treat';
                              return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375, mt: 0.25 }}>
                                {mode === 'split' ? <CallSplitIcon sx={{ fontSize: 12, color: '#818cf8' }} />
                                  : mode === 'participate' ? <GroupIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                                  : <CardGiftcardIcon sx={{ fontSize: 12, color: '#f472b6' }} />}
                                <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                                  {mode} · {t.participants.join(', ')}
                                </Typography>
                              </Box>
                              );
                            })()}
                            {t.paymentMethod && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                <PaymentIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                                <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
                                  {PAYMENT_METHOD_LABELS[t.paymentMethod as PaymentMethod] || t.paymentMethod}
                                </Typography>
                              </Box>
                            )}
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.5 }}>
                              {formatDateShort(t.date, t.createdAt)}
                            </Typography>
                          </Box>

                          {/* Right: amount (tap card to edit/delete) */}
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography
                              fontWeight={700}
                              sx={{
                                color: t.type === 'income' ? '#81c784' : '#e57373',
                                fontSize: '0.95rem',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {t.type === 'income' ? '+' : '-'}{fmtAmt(t.amount, convert, symbol)}
                            </Typography>
                            {fmtOriginal(t) && (
                              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1.2 }}>
                                {fmtOriginal(t)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {t.notes && (
                          <Box
                            onClick={(e) => { e.stopPropagation(); setExpandedNote(expandedNote === t._id ? null : t._id); }}
                            sx={{ mt: 0.75, cursor: 'pointer' }}
                          >
                            <Collapse in={expandedNote === t._id} collapsedSize={20}>
                              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {t.notes}
                              </Typography>
                            </Collapse>
                            {expandedNote !== t._id && (
                              <Typography sx={{ fontSize: '0.68rem', color: isDark ? 'rgba(129,140,248,0.7)' : 'rgba(99,102,241,0.7)', mt: 0.25 }}>
                                tap to expand note
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  </Box>
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
              <TableCell>Payment</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((t) => {
              const isRecurring = recurringLabels && (
                (t.item && recurringLabels.has(t.item)) ||
                recurringLabels.has(t.description)
              );
              return (
              <TableRow key={t._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.date, t.createdAt)}</TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {t.item ? (
                        <>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {t.item}
                          </Typography>
                          {t.description && t.description !== t.item && (
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                            >
                              {t.description}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {t.description}
                        </Typography>
                      )}
                    </Box>
                    {isRecurring && <RepeatIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />}
                    {t.notes && (
                      <Tooltip title={t.notes} placement="top" arrow>
                        <NoteIcon sx={{ fontSize: 14, color: isDark ? 'rgba(129,140,248,0.6)' : 'rgba(99,102,241,0.6)', flexShrink: 0, cursor: 'default' }} />
                      </Tooltip>
                    )}
                  </Box>
                  {t.tags && t.tags.length > 0 && <TagChips tags={t.tags} />}
                </TableCell>
                <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.8rem' }}>
                  {t.participants && t.participants.length > 0 ? (() => {
                    const mode = typeof t.splitBill === 'string' ? t.splitBill : t.splitBill === true ? 'split' : 'treat';
                    return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {mode === 'split' ? <CallSplitIcon sx={{ fontSize: 14, color: '#818cf8', flexShrink: 0 }} />
                        : mode === 'participate' ? <GroupIcon sx={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
                        : <CardGiftcardIcon sx={{ fontSize: 14, color: '#f472b6', flexShrink: 0 }} />}
                      {t.participants.join(', ')}
                    </Box>
                    );
                  })() : '—'}
                </TableCell>
                <TableCell>
                  <Chip label={t.type === 'income' ? 'Income' : 'Expense'} color={t.type === 'income' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {t.paymentMethod ? (PAYMENT_METHOD_LABELS[t.paymentMethod as PaymentMethod] || t.paymentMethod) : '\u2014'}
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={600} sx={{ letterSpacing: '-0.01em', color: t.type === 'income' ? '#81c784' : '#e57373' }}>
                    {t.type === 'income' ? '+' : '-'}{fmtAmt(t.amount, convert, symbol)}
                  </Typography>
                  {fmtOriginal(t) && (
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                      {fmtOriginal(t)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit(t)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => onDelete(t._id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default ExpenseList;
