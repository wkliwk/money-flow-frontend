import React from 'react';
import { Autocomplete, TextField, Box, Chip } from '@mui/material';

export const PRESET_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Utilities',
  'Rent',
  'Salary',
  'Freelance',
  'Investment',
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Drink': '🍽️',
  'Transport': '🚌',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health': '🏥',
  'Utilities': '💡',
  'Rent': '🏠',
  'Salary': '💰',
  'Freelance': '💼',
  'Investment': '📈',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  existingCategories: string[];
}

const CategorySelect: React.FC<Props> = ({ value, onChange, existingCategories }) => {
  const options = Array.from(
    new Set([...PRESET_CATEGORIES, ...existingCategories.map((c) => c.trim()).filter(Boolean)])
  );

  const chips = options.slice(0, 12);

  return (
    <Box>
      <Autocomplete
        freeSolo
        options={options}
        value={value}
        onInputChange={(_, newVal) => onChange(newVal)}
        onChange={(_, newVal) => onChange(typeof newVal === 'string' ? newVal : '')}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Category (optional)"
            fullWidth
            margin="normal"
            placeholder="e.g. Food & Drink"
          />
        )}
      />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 0.75,
          overflowX: 'auto',
          pb: 0.5,
          mt: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {chips.map((cat) => {
          const emoji = CATEGORY_EMOJI[cat];
          const selected = value === cat;
          return (
            <Chip
              key={cat}
              label={emoji ? `${emoji} ${cat}` : cat}
              size="small"
              clickable
              onClick={() => onChange(cat)}
              sx={{
                flexShrink: 0,
                fontSize: '0.72rem',
                height: 28,
                bgcolor: selected ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
                color: selected ? '#818cf8' : 'text.secondary',
                border: '1px solid',
                borderColor: selected ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
                '& .MuiChip-label': { px: 1.25 },
                '&:hover': { bgcolor: 'rgba(129,140,248,0.12)' },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default CategorySelect;
