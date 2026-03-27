import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  MobileStepper,
  Typography,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const ONBOARDING_KEY = 'mf_onboarding_complete';

export const isOnboardingComplete = (): boolean =>
  localStorage.getItem(ONBOARDING_KEY) === 'true';

export const markOnboardingComplete = (): void =>
  localStorage.setItem(ONBOARDING_KEY, 'true');

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: 'fab' | 'scan';
}

const STEPS: Step[] = [
  {
    icon: <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Welcome to Money Flow',
    body: 'The simplest way to track your spending. Log expenses in seconds, spot patterns instantly, and stay in control of your money.',
    highlight: undefined,
  },
  {
    icon: (
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@media (prefers-reduced-motion: no-preference)': {
            animation: 'onboarding-fab-pulse 1.6s ease-in-out infinite',
          },
          '@keyframes onboarding-fab-pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(129,140,248,0.55)' },
            '60%': { boxShadow: '0 0 0 16px rgba(129,140,248,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(129,140,248,0)' },
          },
        }}
      >
        <AddIcon sx={{ color: '#fff', fontSize: 28 }} />
      </Box>
    ),
    title: 'Record your first expense',
    body: 'Tap the + button (bottom-right) anytime to log an expense or income. Takes less than 10 seconds.',
    highlight: 'fab',
  },
  {
    icon: <DocumentScannerIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Scan a receipt',
    body: 'Tap the scan button next to +, point your camera at any receipt, and Money Flow auto-fills the amount, merchant, and category for you.',
    highlight: 'scan',
  },
];

interface Props {
  open: boolean;
  onDismiss: () => void;
  onFabClick: () => void;
}

const StepContent: React.FC<{
  step: Step;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onFabClick: () => void;
}> = ({ step, stepIndex, totalSteps, onNext, onSkip, onFabClick }) => {
  const isLast = stepIndex === totalSteps - 1;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pt: 2,
        pb: 1,
        px: 1,
        gap: 2,
      }}
    >
      {/* Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 64 }}>
        {step.icon}
      </Box>

      {/* Title */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.2rem' }, lineHeight: 1.25 }}
      >
        {step.title}
      </Typography>

      {/* Body */}
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 340 }}
      >
        {step.body}
      </Typography>

      {/* Step 2 CTA: tap the FAB directly */}
      {step.highlight === 'fab' && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onFabClick}
          sx={{ mt: 0.5, fontSize: '0.82rem', borderRadius: 2 }}
          aria-label="Open add expense form"
        >
          Try it now
        </Button>
      )}

      {/* Stepper dots */}
      <MobileStepper
        variant="dots"
        steps={totalSteps}
        position="static"
        activeStep={stepIndex}
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

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, width: '100%', maxWidth: 320, mt: 0.5 }}>
        <Button
          variant="text"
          size="small"
          onClick={onSkip}
          sx={{ color: 'text.disabled', fontSize: '0.82rem', flexShrink: 0 }}
          aria-label="Skip onboarding"
        >
          Skip
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={onNext}
          sx={{ fontSize: '0.9rem', fontWeight: 600, borderRadius: 2 }}
          aria-label={isLast ? 'Finish onboarding' : 'Next step'}
        >
          {isLast ? "Let's go" : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

const OnboardingFlow: React.FC<Props> = ({ open, onDismiss, onFabClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stepIndex, setStepIndex] = React.useState(0);

  const handleNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onDismiss();
    }
  }, [stepIndex, onDismiss]);

  const handleSkip = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleFabClick = useCallback(() => {
    onFabClick();
  }, [onFabClick]);

  const content = (
    <StepContent
      step={STEPS[stepIndex]}
      stepIndex={stepIndex}
      totalSteps={STEPS.length}
      onNext={handleNext}
      onSkip={handleSkip}
      onFabClick={handleFabClick}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleSkip}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            bgcolor: 'background.paper',
            pb: 'env(safe-area-inset-bottom)',
            px: 2,
            pt: 2,
          },
        }}
        aria-label="Onboarding walkthrough"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
          px: 2,
          pt: 1,
          pb: 2,
        },
      }}
      aria-label="Onboarding walkthrough"
    >
      <DialogContent sx={{ p: 0 }}>{content}</DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
