import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';

export interface ItemPreset {
  label: string;
  emoji: string;
  category: string;
}

export const ITEM_PRESETS: ItemPreset[] = [
  { label: '早餐', emoji: '🌅', category: 'Food & Drink' },
  { label: '午餐', emoji: '🍱', category: 'Food & Drink' },
  { label: '晚餐', emoji: '🍽️', category: 'Food & Drink' },
  { label: '車費', emoji: '🚌', category: 'Transport' },
  { label: '費用', emoji: '📋', category: 'Utilities' },
  { label: '超市', emoji: '🛒', category: 'Shopping' },
  { label: '學費', emoji: '📚', category: 'Education' },
  { label: '其他', emoji: '📌', category: 'Other' },
];

interface Props {
  value: string;
  onSelect: (item: ItemPreset) => void;
}

const ItemPicker: React.FC<Props> = ({ value, onSelect }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="caption"
      sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 1 }}
    >
      Item
    </Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
      {ITEM_PRESETS.map((item) => {
        const selected = value === item.label;
        return (
          <ButtonBase
            key={item.label}
            onClick={() => onSelect(item)}
            sx={{
              flexDirection: 'column',
              borderRadius: 2,
              py: 1.25,
              px: 0.5,
              border: '1.5px solid',
              borderColor: selected ? 'rgba(129,140,248,0.5)' : 'rgba(148,163,184,0.1)',
              bgcolor: selected ? 'rgba(129,140,248,0.14)' : 'rgba(148,163,184,0.04)',
              transition: 'all 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              '&:active': { transform: 'scale(0.95)' },
            }}
          >
            <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.emoji}</Typography>
            <Typography
              variant="caption"
              fontWeight={selected ? 700 : 500}
              sx={{ fontSize: '0.72rem', color: selected ? '#818cf8' : 'text.secondary', lineHeight: 1 }}
            >
              {item.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  </Box>
);

export default ItemPicker;
