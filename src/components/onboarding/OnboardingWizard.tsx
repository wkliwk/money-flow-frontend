import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  MenuItem,
  MobileStepper,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../../constants/currencies';
import { detectCurrencyFromLocale } from '../../utils/localeCurrency';
import { createExpense } from '../../services/api';
import { PRESET_CATEGORIES } from '../expenses/CategorySelect';

const WIZARD_KEY = 'mf_onboarded';

function getOwnerFromToken(): string {
  try {
    const token = localStorage.getItem('mf_token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).userId || '';
  } catch {
    return '';
  }
}
const CURRENCY_STORAGE_KEY = 'mf_currency';
const WALKTHROUGH_KEY = 'mf_onboarding_complete';

export const isWizardComplete = (): boolean =>
  localStorage.getItem(WIZARD_KEY) === 'true';

export const markWizardComplete = (): void => {
  localStorage.setItem(WIZARD_KEY, 'true');
  localStorage.setItem(WALKTHROUGH_KEY, 'true');
};

interface Props {
  open: boolean;
  onDismiss: () => void;
}

const TOTAL_STEPS = 4;

const StepDots: React.FC<{ step: number }> = ({ step }) => (
  <MobileStepper
    variant="dots"
    steps={TOTAL_STEPS}
    position="static"
    activeStep={step}
    sx={{
      bgcolor: 'transparent',
      justifyContent: 'center',
      py: 0,
      '& .MuiMobileStepper-dot': { bgcolor: 'action.disabled' },
      '& .MuiMobileStepper-dotActive': { bgcolor: 'primary.main' },
    }}
    nextButton={null}
    backButton={null}
  />
);

const OnboardingWizard: React.FC<Props> = ({ open, onDismiss }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency) || detectCurrencyFromLocale()
  );

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(PRESET_CATEGORIES[0]);
  const [expenseError, setExpenseError] = useState('');
  const [expenseAdded, setExpenseAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCurrencyNext = useCallback(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    setStep(2);
  }, [currency]);

  const handleSkipExpense = useCallback(() => {
    setStep(3);
  }, []);

  const handleAddExpense = useCallback(async () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseAmount || isNaN(amount) || amount <= 0) {
      setExpenseError('Please enter a valid amount');
      return;
    }
    setExpenseError('');
    setSubmitting(true);
    try {
      const owner = getOwnerFromToken();
      await createExpense({
        amount,
        description: expenseDesc || 'First expense',
        category: expenseCategory,
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        owner,
      });
      setExpenseAdded(true);
    } catch {
      setExpenseError('Failed to save expense. You can add it later.');
    } finally {
      setSubmitting(false);
      setStep(3);
    }
  }, [expenseAmount, expenseDesc, expenseCategory]);

  const handleFinish = useCallback(() => {
    markWizardComplete();
    onDismiss();
  }, [onDismiss]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2.5, pt: 2, pb: 1, px: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome to Money Flow
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 340 }}>
                Track your spending in seconds. Stay in control of your money — without the complexity.
              </Typography>
            </Box>
            <StepDots step={0} />
            <Button
              variant="contained"
              fullWidth
              onClick={() => setStep(1)}
              sx={{ fontWeight: 600, borderRadius: 2, maxWidth: 320 }}
              aria-label="Start setup"
            >
              Get Started
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2, pb: 1, px: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Set your currency
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                All amounts will be shown in this currency.
              </Typography>
            </Box>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              fullWidth
              size="small"
              aria-label="Select base currency"
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </MenuItem>
              ))}
            </Select>
            <StepDots step={1} />
            <Box sx={{ display: 'flex', gap: 1.5, maxWidth: 320, width: '100%', alignSelf: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={handleSkipExpense}
                sx={{ color: 'text.disabled', fontSize: '0.82rem', flexShrink: 0 }}
                aria-label="Skip currency setup"
              >
                Skip
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCurrencyNext}
                sx={{ fontWeight: 600, borderRadius: 2 }}
                aria-label="Save currency and continue"
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, pb: 1, px: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Add your first expense
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Optional — you can always add expenses later.
              </Typography>
            </Box>
            <TextField
              label="Amount"
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 'any', 'aria-label': 'Expense amount' }}
              error={!!expenseError}
            />
            <TextField
              label="Description (optional)"
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ 'aria-label': 'Expense description' }}
            />
            <Select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              fullWidth
              size="small"
              aria-label="Expense category"
            >
              {PRESET_CATEGORIES.filter((c) => !['Salary', 'Freelance', 'Investment'].includes(c)).map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            {expenseError && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {expenseError}
              </Typography>
            )}
            <StepDots step={2} />
            <Box sx={{ display: 'flex', gap: 1.5, maxWidth: 320, width: '100%', alignSelf: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={handleSkipExpense}
                sx={{ color: 'text.disabled', fontSize: '0.82rem', flexShrink: 0 }}
                aria-label="Skip adding expense"
              >
                Skip
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleAddExpense}
                disabled={submitting}
                sx={{ fontWeight: 600, borderRadius: 2 }}
                aria-label="Add expense and continue"
              >
                {submitting ? 'Adding…' : 'Add & Continue'}
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2.5, pt: 2, pb: 1, px: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                You're all set!
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 320 }}>
                {[
                  `Currency set to ${CURRENCY_SYMBOLS[currency]} ${currency}`,
                  expenseAdded ? 'First expense logged' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            <StepDots step={3} />
            <Button
              variant="contained"
              fullWidth
              onClick={handleFinish}
              sx={{ fontWeight: 600, borderRadius: 2, maxWidth: 320 }}
              aria-label="Go to dashboard"
            >
              Go to Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          bgcolor: 'background.paper',
          px: 2,
          pt: 1,
          pb: 2,
          width: isMobile ? '100%' : 520,
        },
      }}
      aria-label="Setup wizard"
    >
      <DialogContent sx={{ p: 0 }}>{renderStep()}</DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
