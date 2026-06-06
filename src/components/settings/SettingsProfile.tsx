import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Props {
  email?: string;
  userId?: string;
  onClick?: () => void;
}

function initials(email?: string): string {
  if (!email) return 'R';
  const local = email.split('@')[0];
  if (!local) return '?';
  return local.slice(0, 2).toUpperCase();
}

const SettingsProfile: React.FC<Props> = ({ email, userId, onClick }) => {
  const interactive = !!onClick;
  return (
    <Box
      data-testid="settings-profile-card"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) onClick?.();
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 2.5,
        bgcolor: 'background.paper',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background 0.12s',
        '&:hover': interactive ? { bgcolor: 'action.hover' } : undefined,
      }}
    >
      <Avatar
        sx={{
          width: 50,
          height: 50,
          borderRadius: '16px',
          bgcolor: 'primary.main',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          fontSize: '1.05rem',
        }}
        variant="rounded"
      >
        {initials(email)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 600,
            fontSize: '0.95rem',
            mb: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {email || 'Your account'}
        </Typography>
        {userId && (
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '0.7rem',
              color: 'text.disabled',
              fontFeatureSettings: '"tnum"',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            ID · {userId}
          </Typography>
        )}
      </Box>
      {interactive && <ChevronRightIcon sx={{ color: 'text.disabled' }} />}
    </Box>
  );
};

export default SettingsProfile;
