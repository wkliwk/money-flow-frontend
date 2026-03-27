import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import CategoryIcon from '@mui/icons-material/Category';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../types';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <LocalAtmIcon sx={{ fontSize: '14px !important' }} />,
  octopus: <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  payme: <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  fps: <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  credit_card: <CreditCardIcon sx={{ fontSize: '14px !important' }} />,
  debit_card: <CreditCardIcon sx={{ fontSize: '14px !important' }} />,
  bank_transfer: <AccountBalanceIcon sx={{ fontSize: '14px !important' }} />,
  alipay_hk: <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  wechat_pay: <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  other: <CategoryIcon sx={{ fontSize: '14px !important' }} />,
};

export function getPaymentMethodIcon(method: PaymentMethod): React.ReactNode {
  return PAYMENT_METHOD_ICONS[method];
}

interface Props {
  value: PaymentMethod | null;
  onChange: (v: PaymentMethod | null) => void;
}

const PaymentMethodPicker: React.FC<Props> = ({ value, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        Payment Method
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {PAYMENT_METHODS.map((m) => (
          <Chip
            key={m}
            icon={PAYMENT_METHOD_ICONS[m] as React.ReactElement}
            label={PAYMENT_METHOD_LABELS[m]}
            size="small"
            clickable
            onClick={() => onChange(value === m ? null : m)}
            sx={{
              fontSize: '0.72rem',
              height: 28,
              bgcolor: value === m ? (isDark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.22)') : 'rgba(148,163,184,0.08)',
              color: value === m ? theme.palette.primary.main : 'text.secondary',
              border: '1px solid',
              borderColor: value === m ? (isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.5)') : 'rgba(148,163,184,0.12)',
              fontWeight: value === m ? 700 : 400,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PaymentMethodPicker;
