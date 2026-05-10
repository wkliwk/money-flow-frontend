import React from 'react';
import { Box, Button, Typography, SvgIconProps } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface EmptyStateProps {
  heading: string;
  subtext: string;
  ctaLabel?: string;
  onCta?: () => void;
  /** Custom icon component. Defaults to AccountBalanceWalletIcon. Rendered at 48px per design spec. */
  icon?: React.ComponentType<SvgIconProps>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  heading,
  subtext,
  ctaLabel,
  onCta,
  icon: Icon = AccountBalanceWalletIcon,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Design spec: vertical padding 3xl top + bottom
      py: { xs: 6, sm: 8 },
      minHeight: '40vh',
      textAlign: 'center',
      px: 3,
    }}
  >
    {/* Design spec: icon 48px, color fg.muted */}
    <Box
      role="img"
      aria-label="Empty state icon"
      sx={{ display: 'flex', mb: 2, color: 'text.disabled' }}
    >
      <Icon sx={{ fontSize: 48 }} />
    </Box>
    {/* Title: h2-style, fg.primary, max-width 280 */}
    <Typography
      component="h2"
      variant="h5"
      fontWeight={700}
      sx={{ maxWidth: 280, color: 'text.primary', mb: 1 }}
    >
      {heading}
    </Typography>
    {/* Body: fg.secondary, max-width 320, centered */}
    <Typography
      variant="body1"
      sx={{ maxWidth: 320, color: 'text.secondary', mb: ctaLabel ? 3 : 0 }}
    >
      {subtext}
    </Typography>
    {ctaLabel && onCta && (
      <Button variant="contained" onClick={onCta} size="medium">
        {ctaLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
