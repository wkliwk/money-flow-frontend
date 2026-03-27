import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, TextField, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import { compareTwoStrings } from 'string-similarity';

interface Props {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[]; // preset + history, deduped
  categoriesByDescription?: Record<string, string>;
  onCategorySelect?: (category: string) => void;
}

const DescriptionPicker: React.FC<Props> = ({ value, onChange, suggestions, categoriesByDescription = {}, onCategorySelect }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [custom, setCustom] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Smart categorization: find similar description and suggest its category
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const searchText = (value || custom).trim().toLowerCase();
    if (!searchText || !onCategorySelect) {
      setSuggestedCategory(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      let bestMatch: { desc: string; category: string; score: number } | null = null;

      for (const [desc, category] of Object.entries(categoriesByDescription)) {
        const score = compareTwoStrings(searchText, desc);
        if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { desc, category, score };
        }
      }

      if (bestMatch) {
        setSuggestedCategory(bestMatch.category);
        // Auto-apply category on exact or near-exact match
        if (bestMatch.score >= 0.85 && onCategorySelect) {
          onCategorySelect(bestMatch.category);
        }
      } else {
        setSuggestedCategory(null);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, custom, categoriesByDescription, onCategorySelect]);

  const addCustom = () => {
    const t = custom.trim();
    if (!t) return;
    onChange(t);
    if (suggestedCategory && onCategorySelect) {
      onCategorySelect(suggestedCategory);
    }
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
                bgcolor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)',
                color: theme.palette.primary.main,
                border: `1px solid ${isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)'}`,
                '& .MuiChip-deleteIcon': { color: isDark ? 'rgba(129,140,248,0.5)' : 'rgba(99,102,241,0.5)', fontSize: 14 },
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
                  bgcolor: selected ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.06)',
                  color: selected ? theme.palette.primary.main : 'text.secondary',
                  border: '1px solid',
                  borderColor: selected ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.1)',
                  transition: 'all 0.1s ease',
                  '&:active': { transform: 'scale(0.96)' },
                }}
              />
            );
          })}
        </Box>
      )}

      {/* Category suggestion */}
      {suggestedCategory && (
        <Box sx={{ mb: 0.75 }}>
          <Chip
            label={`Category: ${suggestedCategory}`}
            size="small"
            onClick={() => onCategorySelect?.(suggestedCategory)}
            sx={{
              fontSize: '0.72rem',
              height: 26,
              bgcolor: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(16,185,129,0.12)',
              color: theme.palette.success.light,
              border: `1px solid ${isDark ? 'rgba(52,211,153,0.3)' : 'rgba(16,185,129,0.38)'}`,
              cursor: 'pointer',
              '&:hover': { bgcolor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(16,185,129,0.18)' },
            }}
          />
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
          <IconButton size="small" onClick={addCustom} sx={{ bgcolor: isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.12)', border: `1px solid ${isDark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.25)'}`, '&:hover': { bgcolor: isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)' } }}>
            <AddIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default DescriptionPicker;
