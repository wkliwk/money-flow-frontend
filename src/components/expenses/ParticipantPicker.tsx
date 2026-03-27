import React, { useState } from 'react';
import { Box, Typography, TextField, IconButton, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions?: string[];
}

const ParticipantPicker: React.FC<Props> = ({ value, onChange, suggestions = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [input, setInput] = useState('');

  const add = () => {
    const name = input.trim();
    if (!name) return;
    if (value.some((n) => n.toLowerCase() === name.toLowerCase())) { setInput(''); return; }
    console.log('[DEBUG] ParticipantPicker: Adding participant', { current: value, adding: name, newArray: [...value, name] });
    onChange([...value, name]);
    setInput('');
  };

  const toggle = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((n) => n !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const unselectedSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        With
      </Typography>
      {/* Selected participants */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: value.length ? 1 : 0 }}>
        {value.map((name) => (
          <Chip
            key={name}
            label={name}
            size="small"
            onDelete={() => onChange(value.filter((n) => n !== name))}
            sx={{
              height: 26,
              fontSize: '0.75rem',
              bgcolor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.15)',
              color: theme.palette.primary.main,
              border: `1px solid ${isDark ? 'rgba(129,140,248,0.3)' : 'rgba(99,102,241,0.38)'}`,
              '& .MuiChip-deleteIcon': { color: isDark ? 'rgba(129,140,248,0.5)' : 'rgba(99,102,241,0.5)', fontSize: 14 },
            }}
          />
        ))}
      </Box>
      {/* Suggestion chips */}
      {unselectedSuggestions.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
          {unselectedSuggestions.map((name) => (
            <Chip
              key={name}
              label={name}
              size="small"
              onClick={() => toggle(name)}
              sx={{
                height: 26,
                fontSize: '0.75rem',
                bgcolor: 'rgba(148,163,184,0.07)',
                color: 'text.secondary',
                border: '1px solid rgba(148,163,184,0.15)',
                cursor: 'pointer',
                '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)', color: theme.palette.primary.main },
              }}
            />
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Add person…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.75 } }}
        />
        <IconButton size="small" onClick={add} disabled={!input.trim()} sx={{ bgcolor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)', border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)' } }}>
          <AddIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ParticipantPicker;
