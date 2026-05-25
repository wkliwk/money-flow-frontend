import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  children: React.ReactNode;
  description?: string;
}

/**
 * iOS-style settings section per MoneyFlow Hi-Fi spec (#332 phase 5).
 *
 * Uppercase section header sits in the gutter ABOVE a white card with
 * the section's controls. Stack multiple SettingsSection components for
 * the iOS grouped list look.
 */
const SettingsSection: React.FC<Props> = ({ title, children, description }) => {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        component="h2"
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: '#A8A29E',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 0.75,
          ml: 1,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E6E3DC',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
      {description && (
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.7rem',
            color: '#A8A29E',
            mt: 0.75,
            ml: 1,
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default SettingsSection;
