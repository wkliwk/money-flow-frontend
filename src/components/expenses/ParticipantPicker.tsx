import React, { useState } from 'react';
import { Box, Typography, TextField, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  value: string[];
  onChange: (names: string[]) => void;
}

const ParticipantPicker: React.FC<Props> = ({ value, onChange }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const name = input.trim();
    if (!name) return;
    if (value.some((n) => n.toLowerCase() === name.toLowerCase())) { setInput(''); return; }
    onChange([...value, name]);
    setInput('');
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        With
      </Typography>
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
              bgcolor: 'rgba(129,140,248,0.12)',
              color: '#818cf8',
              border: '1px solid rgba(129,140,248,0.3)',
              '& .MuiChip-deleteIcon': { color: 'rgba(129,140,248,0.5)', fontSize: 14 },
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Add person…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.75 } }}
        />
        <IconButton size="small" onClick={add} disabled={!input.trim()} sx={{ bgcolor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', '&:hover': { bgcolor: 'rgba(129,140,248,0.18)' } }}>
          <AddIcon sx={{ fontSize: 18, color: '#818cf8' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ParticipantPicker;
