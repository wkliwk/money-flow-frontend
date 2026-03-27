import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { TransactionTemplate } from '../../hooks/useTemplates';

interface Props {
  templates: TransactionTemplate[];
  onSelect: (t: TransactionTemplate) => void;
  onManage: () => void;
}

const TemplateChips: React.FC<Props> = ({ templates, onSelect, onManage }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (templates.length === 0) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.75 }}
      >
        Templates
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          pb: 0.25,
        }}
      >
        {templates.map((t) => (
          <Chip
            key={t.id}
            label={t.label.length > 18 ? t.label.slice(0, 18) + '…' : t.label}
            size="small"
            clickable
            onClick={() => onSelect(t)}
            sx={{
              flexShrink: 0,
              fontSize: '0.75rem',
              height: 30,
              fontWeight: 500,
              bgcolor: t.type === 'income'
                ? (isDark ? 'rgba(52,211,153,0.1)' : 'rgba(16,185,129,0.12)')
                : (isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)'),
              color: t.type === 'income' ? theme.palette.success.light : theme.palette.primary.main,
              border: '1px solid',
              borderColor: t.type === 'income'
                ? (isDark ? 'rgba(52,211,153,0.25)' : 'rgba(16,185,129,0.3)')
                : (isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.3)'),
              '&:hover': {
                bgcolor: t.type === 'income'
                  ? (isDark ? 'rgba(52,211,153,0.18)' : 'rgba(16,185,129,0.22)')
                  : (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)'),
              },
            }}
          />
        ))}
        {/* Manage button */}
        <Chip
          icon={<AddIcon sx={{ fontSize: '14px !important' }} />}
          label="Edit"
          size="small"
          clickable
          onClick={onManage}
          sx={{
            flexShrink: 0,
            fontSize: '0.72rem',
            height: 30,
            bgcolor: 'rgba(148,163,184,0.06)',
            color: 'text.disabled',
            border: '1px solid rgba(148,163,184,0.1)',
            '&:hover': { bgcolor: 'rgba(148,163,184,0.12)', color: 'text.secondary' },
          }}
        />
      </Box>
    </Box>
  );
};

export default TemplateChips;
