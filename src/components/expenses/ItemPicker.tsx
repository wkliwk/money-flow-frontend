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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LaptopIcon from '@mui/icons-material/Laptop';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WorkIcon from '@mui/icons-material/Work';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import HomeIcon from '@mui/icons-material/Home';
import { TransactionType } from '../../types';

export interface ItemPreset {
  label: string;
  en: string;
  icon: React.ReactElement;
  category: string;
  color: string;
  type: TransactionType;
}

export const ITEM_PRESETS: ItemPreset[] = [
  // Expense items
  { label: '早餐', en: 'Breakfast', icon: <WbSunnyIcon />,       category: 'Food & Drink', color: '#fbbf24', type: 'expense' },
  { label: '午餐', en: 'Lunch',     icon: <LunchDiningIcon />,    category: 'Food & Drink', color: '#34d399', type: 'expense' },
  { label: '晚餐', en: 'Dinner',    icon: <DinnerDiningIcon />,   category: 'Food & Drink', color: '#f472b6', type: 'expense' },
  { label: '車費', en: 'Transport', icon: <DirectionsBusIcon />,  category: 'Transport',    color: '#38bdf8', type: 'expense' },
  { label: '費用', en: 'Bills',     icon: <PaymentsIcon />,       category: 'Utilities',    color: '#a78bfa', type: 'expense' },
  { label: '超市', en: 'Groceries', icon: <ShoppingCartIcon />,   category: 'Shopping',     color: '#fb7185', type: 'expense' },
  { label: '學費', en: 'Education', icon: <SchoolIcon />,         category: 'Education',    color: '#818cf8', type: 'expense' },
  { label: '其他', en: 'Other',     icon: <CategoryIcon />,       category: 'Other',        color: '#94a3b8', type: 'expense' },
  // Income items
  { label: '工資',   en: 'Salary',     icon: <AttachMoneyIcon />, category: 'Salary',     color: '#34d399', type: 'income' },
  { label: '自由工', en: 'Freelance',  icon: <LaptopIcon />,      category: 'Freelance',  color: '#818cf8', type: 'income' },
  { label: '投資',   en: 'Investment', icon: <ShowChartIcon />,   category: 'Investment', color: '#fbbf24', type: 'income' },
  { label: '兼職',   en: 'Part-time',  icon: <WorkIcon />,        category: 'Freelance',  color: '#38bdf8', type: 'income' },
  { label: '獎金',   en: 'Bonus',      icon: <CardGiftcardIcon />,category: 'Salary',     color: '#f472b6', type: 'income' },
  { label: '租金',   en: 'Rent',       icon: <HomeIcon />,        category: 'Property',   color: '#a78bfa', type: 'income' },
  { label: '其他',   en: 'Other',      icon: <CategoryIcon />,    category: 'Other',      color: '#94a3b8', type: 'income' },
];

export const ITEM_SUGGESTIONS: Record<string, string[]> = {
  '早餐': ["McDonald's", 'Tim Hortons', 'Starbucks', '茶餐廳', '麥當勞'],
  '午餐': ['茶餐廳', "McDonald's", 'Subway', '快餐', '便利店'],
  '晚餐': ['火鍋', '茶餐廳', '日本菜', '西餐', '燒烤'],
  '車費': ['MTR', 'Bus', 'Uber', 'Taxi', 'TransLink'],
  '費用': ['Rent', 'Electricity', 'Internet', 'Phone', 'Water'],
  '超市': ['T&T', 'Costco', 'Walmart', 'PARKnSHOP', 'AEON'],
  '學費': ['Coursera', 'Udemy', 'Course fee'],
  '工資': ['Salary', 'Paycheque'],
  '自由工': ['Client payment', 'Contract work', 'Invoice'],
  '投資': ['Dividend', 'Stock sale', 'Interest'],
  '兼職': ['Part-time work', 'Shift pay'],
  '獎金': ['Year-end bonus', 'Performance bonus'],
  '租金': ['Rental income'],
};

interface Props {
  value: string;
  type: TransactionType;
  onSelect: (item: ItemPreset) => void;
}

const ItemPicker: React.FC<Props> = ({ value, type, onSelect }) => {
  const presets = ITEM_PRESETS.filter((p) => p.type === type);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 1 }}
      >
        Item
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, mx: -0.5, px: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {presets.map((item) => {
          const selected = value === item.label;
          return (
            <ButtonBase
              key={item.label}
              onClick={() => onSelect(item)}
              sx={{
                flexShrink: 0,
                flexDirection: 'column',
                borderRadius: 2.5,
                py: 1.25,
                px: 1,
                width: 64,
                gap: 0.5,
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
                sx={{ fontSize: '0.7rem', color: selected ? item.color : 'text.secondary', lineHeight: 1, textAlign: 'center' }}
              >
                {item.label}
              </Typography>
              <Typography
                sx={{ fontSize: '0.55rem', color: selected ? item.color : 'text.disabled', lineHeight: 1, opacity: 0.8 }}
              >
                {item.en}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default ItemPicker;
