import React, { forwardRef, memo } from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import { radius } from './tokens';

export interface InputProps
  extends Omit<TextFieldProps, 'variant' | 'size'> {
  /** Always render label above the field — placeholder-only is forbidden. */
  label: string;
  /** Helper text rendered below the field. Replaced by `error` when set. */
  helperText?: React.ReactNode;
  /** Error message. When provided, switches the field to error state. */
  error?: boolean;
  errorText?: string;
}

/**
 * Input — UI primitive matching the design-system spec.
 *
 * Wraps MUI TextField with the canonical 40h size, md radius, and a strict
 * label-above contract. Errors are shown as caption text below the field.
 */
const InputImpl = forwardRef<HTMLDivElement, InputProps>(function Input(
  { label, helperText, error, errorText, sx, InputLabelProps, ...rest },
  ref,
) {
  const theme = useTheme();
  const showError = Boolean(error);
  const helper = showError && errorText ? errorText : helperText;
  // The theme's error.dark (#e11d48) sits just below WCAG AA on the
  // bg.app surface. Apply a darker rose for caption text to clear 4.5:1.
  const errorTextColor =
    theme.palette.mode === 'dark' ? '#fda4af' : '#be123c';

  return (
    <MuiTextField
      ref={ref}
      label={label}
      variant="outlined"
      size="small"
      fullWidth
      error={showError}
      helperText={helper}
      InputLabelProps={{ shrink: true, ...InputLabelProps }}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 40,
          borderRadius: `${radius.md}px`,
          '& fieldset': {
            borderColor: theme.palette.divider,
            transition: 'border-color 200ms cubic-bezier(.2,.8,.2,1)',
          },
          '&:hover fieldset': {
            borderColor: theme.palette.text.secondary,
          },
          '&.Mui-focused fieldset': {
            borderWidth: 2,
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-error fieldset': {
            borderColor: theme.palette.error.main,
          },
        },
        '& .MuiFormHelperText-root': {
          fontSize: 12,
          marginLeft: 0,
          '&.Mui-error': {
            // Use a darker rose for caption text to clear WCAG AA contrast.
            color: errorTextColor,
          },
        },
        '& .MuiInputLabel-root.Mui-error': {
          color: errorTextColor,
        },
        ...sx,
      }}
      {...rest}
    />
  );
});

export const Input = memo(InputImpl);
export default Input;
