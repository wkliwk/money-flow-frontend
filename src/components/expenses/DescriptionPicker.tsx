import React, { useState } from 'react';
import { Box, Typography, Chip, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[]; // preset + history, deduped
}

const DescriptionPicker: React.FC<Props> = ({ value, onChange, suggestions }) => {
  const [custom, setCustom] = useState('');

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    onChange(t);
    setCustom('');
  };

  const toggle = (tag: string) => {
    onChange(value === tag ? '' : tag);
  };

  // Custom value chip shown in row when set and not in suggestions list
  const customChip = value && !suggestions.includes(value) ? value : null;
  const hasChips = suggestions.length > 0 || customChip;

  return (
    <Box sx={{ mt: 0.5, mb: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
        Note (optional)
      </Typography>

      {/* Chips row — always above input when chips exist */}
      {hasChips && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
          {/* Custom value chip first if set */}
          {customChip && (
            <Chip
              key="__custom__"
              label={customChip}
              size="small"
              onDelete={() => onChange('')}
              sx={{
                height: 26,
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: 'rgba(129,140,248,0.18)',
                color: '#818cf8',
                border: '1px solid rgba(129,140,248,0.4)',
                '& .MuiChip-deleteIcon': { color: 'rgba(129,140,248,0.5)', fontSize: 14 },
              }}
            />
          )}
          {/* Suggestion chips */}
          {suggestions.map((tag) => {
            const selected = value === tag;
            return (
              <Chip
                key={tag}
                label={tag}
                size="small"
                clickable
                onClick={() => toggle(tag)}
                sx={{
                  height: 26,
                  fontSize: '0.78rem',
                  fontWeight: selected ? 700 : 400,
                  bgcolor: selected ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)',
                  color: selected ? '#818cf8' : 'text.secondary',
                  border: '1px solid',
                  borderColor: selected ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.1)',
                  transition: 'all 0.1s ease',
                  '&:active': { transform: 'scale(0.96)' },
                }}
              />
            );
          })}
        </Box>
      )}

      {/* Custom input — always below chips */}
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={suggestions.length > 0 ? 'Custom…' : 'e.g. McDonald\'s, MTR…'}
          value={custom}
          onChange={(e) => { setCustom(e.target.value); if (e.target.value === '') onChange(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.75 } }}
        />
        {custom.trim() && (
          <IconButton size="small" onClick={addCustom} sx={{ bgcolor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', '&:hover': { bgcolor: 'rgba(129,140,248,0.18)' } }}>
            <AddIcon sx={{ fontSize: 18, color: '#818cf8' }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default DescriptionPicker;
