import React from 'react';
import { Box, Chip } from '@mui/material';
import { Currency, CURRENCIES, CURRENCY_SYMBOLS } from '../../hooks/useFxRates';
import { useCurrencyPreferences } from '../../hooks/useCurrencyPreferences';

interface Props {
  currency: Currency;
  onChange: (c: Currency) => void;
}

const CurrencyPicker: React.FC<Props> = ({ currency, onChange }) => {
  const { isEnabled } = useCurrencyPreferences();

  const visibleCurrencies = CURRENCIES.filter(
    (c) => isEnabled(c) || c === currency
  );

  return (
    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', flexWrap: 'nowrap' }}>
      {visibleCurrencies.map((c) => (
        <Chip
          key={c}
          label={`${CURRENCY_SYMBOLS[c]} ${c}`}
          size="small"
          clickable
          onClick={() => onChange(c)}
          sx={{
            fontSize: '0.7rem',
            height: 22,
            bgcolor: currency === c ? 'rgba(129,140,248,0.18)' : 'rgba(148,163,184,0.06)',
            color: currency === c ? '#818cf8' : 'text.disabled',
            border: '1px solid',
            borderColor: currency === c ? 'rgba(129,140,248,0.35)' : 'rgba(148,163,184,0.1)',
            fontWeight: currency === c ? 700 : 400,
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </Box>
  );
};

export default CurrencyPicker;
