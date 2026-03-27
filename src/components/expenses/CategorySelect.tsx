import React from 'react';
import { Autocomplete, TextField, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
                bgcolor: selected ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
                color: selected ? theme.palette.primary.main : 'text.secondary',
                border: '1px solid',
                borderColor: selected ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
                '& .MuiChip-label': { px: 1.25 },
                '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.15)' },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default CategorySelect;
