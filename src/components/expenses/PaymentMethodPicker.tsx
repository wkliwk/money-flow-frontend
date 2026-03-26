import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import { PAYMENT_METHODS, PaymentMethod } from '../../types';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  'Cash': <LocalAtmIcon sx={{ fontSize: '14px !important' }} />,
  'Octopus': <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  'PayMe': <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  'FPS': <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  'Credit Card': <CreditCardIcon sx={{ fontSize: '14px !important' }} />,
  'Debit Card': <CreditCardIcon sx={{ fontSize: '14px !important' }} />,
  'Bank Transfer': <AccountBalanceIcon sx={{ fontSize: '14px !important' }} />,
  'AlipayHK': <PaymentIcon sx={{ fontSize: '14px !important' }} />,
  'WeChat Pay': <PaymentIcon sx={{ fontSize: '14px !important' }} />,
};

export function getPaymentMethodIcon(method: PaymentMethod): React.ReactNode {
  return PAYMENT_METHOD_ICONS[method];
}

interface Props {
  value: PaymentMethod | null;
  onChange: (v: PaymentMethod | null) => void;
}

const PaymentMethodPicker: React.FC<Props> = ({ value, onChange }) => {
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
            label={m}
            size="small"
            clickable
            onClick={() => onChange(value === m ? null : m)}
            sx={{
              fontSize: '0.72rem',
              height: 28,
              bgcolor: value === m ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.08)',
              color: value === m ? '#818cf8' : 'text.secondary',
              border: '1px solid',
              borderColor: value === m ? 'rgba(129,140,248,0.4)' : 'rgba(148,163,184,0.12)',
              fontWeight: value === m ? 700 : 400,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PaymentMethodPicker;
