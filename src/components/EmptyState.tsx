import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface EmptyStateProps {
  heading: string;
  subtext: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ heading, subtext, ctaLabel, onCta }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      textAlign: 'center',
      px: 3,
    }}
  >
    <AccountBalanceWalletIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" fontWeight={700} mb={0.5}>
      {heading}
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={ctaLabel ? 3 : 0}>
      {subtext}
    </Typography>
    {ctaLabel && onCta && (
      <Button variant="contained" onClick={onCta}>
        {ctaLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
