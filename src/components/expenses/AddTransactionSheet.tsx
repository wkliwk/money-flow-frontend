import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { TransactionRequest, TransactionType } from '../../types';
import { PRESET_CATEGORIES } from './CategorySelect';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionRequest, 'owner'>) => Promise<void>;
  existingCategories?: string[];
}

const todayStr = () => new Date().toISOString().split('T')[0];

const MAX_AMOUNT = 1_000_000_000;

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddTransactionSheet: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  existingCategories = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const amountRef = useRef<HTMLInputElement | null>(null);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState<{ amount: boolean; category: boolean }>({
    amount: false,
    category: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setAmount('');
      setType('expense');
      setCategory('');
      setDate(todayStr());
      setNote('');
      setTouched({ amount: false, category: false });
      setSubmitting(false);
      setSubmitError('');
    }
  }, [open]);

  // Autofocus amount when opened
  useEffect(() => {
    if (open) {
      // Wait for dialog transition to mount the input.
      const t = setTimeout(() => {
        amountRef.current?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const categoryOptions = React.useMemo(() => {
    const merged = Array.from(
      new Set([...PRESET_CATEGORIES, ...existingCategories.map((c) => c.trim()).filter(Boolean)]),
    );
    return merged;
  }, [existingCategories]);

  const parsedAmount = parseFloat(amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= MAX_AMOUNT;
  const categoryValid = category.trim().length > 0;
  const isValid = amountValid && categoryValid;

  const amountError = (() => {
    if (!touched.amount) return '';
    if (!amount) return 'Amount is required';
    if (isNaN(parsedAmount)) return 'Enter a valid number';
    if (parsedAmount <= 0) return 'Amount must be greater than 0';
    if (parsedAmount > MAX_AMOUNT) return 'Amount is too large';
    return '';
  })();

  const categoryError = touched.category && !categoryValid ? 'Category is required' : '';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits and one decimal point only
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setAmount(normalized);
  };

  const handleSubmit = async () => {
    setTouched({ amount: true, category: true });
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        description: note.trim() || category.trim(),
        amount: parsedAmount,
        type,
        category: category.trim(),
        notes: note.trim() || undefined,
        date,
      });
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setSubmitError(e?.response?.data?.error || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isValid && !submitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="xs"
      TransitionComponent={isMobile ? SlideUp : undefined}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 480 },
          maxWidth: { md: 480 },
          borderRadius: { xs: 0, md: 3 },
        },
      }}
      aria-labelledby="add-tx-title"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
          color="inherit"
          sx={{ textTransform: 'none', fontWeight: 500, minWidth: 64 }}
        >
          Cancel
        </Button>
        <Typography id="add-tx-title" variant="subtitle1" fontWeight={700}>
          Add transaction
        </Typography>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          color="primary"
          variant="text"
          sx={{ textTransform: 'none', fontWeight: 700, minWidth: 64 }}
        >
          {submitting ? <CircularProgress size={18} /> : 'Save'}
        </Button>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, md: 3 }, py: 3 }}>
        {/* Big amount input */}
        <Box sx={{ textAlign: 'center', mt: { xs: 1, md: 0 }, mb: 2 }}>
          <TextField
            inputRef={amountRef}
            value={amount}
            onChange={handleAmountChange}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            placeholder="0"
            variant="standard"
            inputProps={{
              inputMode: 'decimal',
              'aria-label': 'Amount',
              autoComplete: 'off',
              style: {
                textAlign: 'center',
                fontSize: '3rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              },
            }}
            InputProps={{
              startAdornment: (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '2rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    mr: 1,
                  }}
                >
                  $
                </Typography>
              ),
              disableUnderline: false,
            }}
            error={Boolean(amountError)}
            helperText={amountError || ' '}
            FormHelperTextProps={{ sx: { textAlign: 'center', mt: 1 } }}
            sx={{
              width: '100%',
              '& .MuiInput-underline:before': { borderBottomColor: theme.palette.divider },
            }}
          />
        </Box>

        {/* Expense/Income toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v) => {
              if (v) setType(v);
            }}
            size="small"
            aria-label="Transaction type"
          >
            <ToggleButton value="expense" sx={{ textTransform: 'none', px: 2.5 }}>
              <TrendingDownIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Expense
            </ToggleButton>
            <ToggleButton value="income" sx={{ textTransform: 'none', px: 2.5 }}>
              <TrendingUpIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Income
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Category */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            Category
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setTouched((t) => ({ ...t, category: true }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, category: true }))}
            error={Boolean(categoryError)}
            helperText={categoryError || ' '}
            SelectProps={{ native: true, displayEmpty: true, inputProps: { 'aria-label': 'Category' } }}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </TextField>
        </Box>

        {/* Date */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            Date
          </Typography>
          <TextField
            type="date"
            fullWidth
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputProps={{ 'aria-label': 'Date' }}
          />
        </Box>

        {/* Note (optional) */}
        <Box sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            Note (optional)
          </Typography>
          <TextField
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            size="small"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Add a note…"
            inputProps={{ maxLength: 500, 'aria-label': 'Note' }}
          />
        </Box>

        {submitError && (
          <Typography
            role="alert"
            sx={{
              mt: 2,
              color: 'error.main',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {submitError}
          </Typography>
        )}
      </DialogContent>

      {/* Desktop secondary save bar (mobile uses header button only) */}
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 96 }}
          >
            {submitting ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

export default AddTransactionSheet;
