import React from 'react';
import { Box, Button, Typography, SvgIconProps } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface EmptyStateProps {
  heading: string;
  subtext: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: React.ReactElement<SvgIconProps>;
}

const EmptyState: React.FC<EmptyStateProps> = ({ heading, subtext, ctaLabel, onCta, icon }) => (
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
    {icon
      ? React.cloneElement(icon, { sx: { fontSize: 80, color: 'text.disabled', mb: 2, ...((icon.props as SvgIconProps).sx as Record<string, unknown>) } })
      : <AccountBalanceWalletIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
    }
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
