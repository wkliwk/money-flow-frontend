import React from 'react';
import { Box, Typography, ButtonBase, SvgIcon } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';

export interface ItemPreset {
  label: string;
  icon: React.ReactElement;
  category: string;
  color: string;
}

export const ITEM_PRESETS: ItemPreset[] = [
  { label: '早餐', icon: <WbSunnyIcon />,       category: 'Food & Drink', color: '#fbbf24' },
  { label: '午餐', icon: <LunchDiningIcon />,    category: 'Food & Drink', color: '#34d399' },
  { label: '晚餐', icon: <DinnerDiningIcon />,   category: 'Food & Drink', color: '#f472b6' },
  { label: '車費', icon: <DirectionsBusIcon />,  category: 'Transport',    color: '#38bdf8' },
  { label: '費用', icon: <PaymentsIcon />,       category: 'Utilities',    color: '#a78bfa' },
  { label: '超市', icon: <ShoppingCartIcon />,   category: 'Shopping',     color: '#fb7185' },
  { label: '學費', icon: <SchoolIcon />,         category: 'Education',    color: '#818cf8' },
  { label: '其他', icon: <CategoryIcon />,       category: 'Other',        color: '#94a3b8' },
];

interface Props {
  value: string;
  onSelect: (item: ItemPreset) => void;
}

const ItemPicker: React.FC<Props> = ({ value, onSelect }) => (
  <Box sx={{ mb: 1.5 }}>
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
              borderRadius: 2.5,
              py: 1.5,
              px: 0.5,
              gap: 0.75,
              border: '1.5px solid',
              borderColor: selected ? `${item.color}66` : 'rgba(148,163,184,0.1)',
              bgcolor: selected ? `${item.color}1a` : 'rgba(148,163,184,0.04)',
              transition: 'all 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:active': { transform: 'scale(0.94)' },
            }}
          >
            <SvgIcon
              component={() => React.cloneElement(item.icon, {
                sx: { fontSize: 22, color: selected ? item.color : 'rgba(148,163,184,0.5)' },
              })}
            />
            <Typography
              variant="caption"
              fontWeight={selected ? 700 : 500}
              sx={{ fontSize: '0.72rem', color: selected ? item.color : 'text.disabled', lineHeight: 1 }}
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
