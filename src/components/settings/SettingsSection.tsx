import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  children: React.ReactNode;
  description?: string;
}

const SettingsSection: React.FC<Props> = ({ title, children, description }) => {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        component="h2"
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: 'text.disabled',
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
          bgcolor: 'background.paper',
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
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
            color: 'text.disabled',
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
