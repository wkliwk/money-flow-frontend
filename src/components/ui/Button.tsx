import React, { forwardRef, memo } from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import { buttonSize, motion, radius, ButtonSizeToken } from './tokens';

export type UIButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type UIButtonSize = ButtonSizeToken;

export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  /** Visual variant. Default: `primary`. */
  variant?: UIButtonVariant;
  /** Size token. Default: `md` (40h, ≥44px touch target on mobile). */
  size?: UIButtonSize;
}

/**
 * Button — UI primitive matching the design-system spec.
 *
 * Wraps MUI Button with variant/size tokens. Use `primary` for the main CTA,
 * `secondary` for alternate actions, `ghost` for tertiary/nav, and
 * `destructive` for delete operations.
 *
 * Sizes: `sm` (32h) / `md` (40h) / `lg` (48h). Always use `md` or larger on
 * mobile touch targets.
 */
const ButtonImpl = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', sx, children, ...rest },
  ref,
) {
  const theme = useTheme();
  const sizeToken = buttonSize[size];

  const variantSx = (() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': { backgroundColor: theme.palette.primary.dark },
          '&:disabled': {
            backgroundColor: alpha(theme.palette.primary.main, 0.4),
            color: theme.palette.primary.contrastText,
          },
        };
      case 'secondary':
        return {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.04),
            borderColor: theme.palette.text.secondary,
          },
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.06) },
        };
      case 'destructive':
        return {
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText ?? '#ffffff',
          '&:hover': {
            backgroundColor: theme.palette.error.dark ?? theme.palette.error.main,
          },
        };
      default:
        return {};
    }
  })();

  return (
    <MuiButton
      ref={ref}
      disableElevation
      variant="contained"
      sx={{
        minHeight: sizeToken.height,
        height: sizeToken.height,
        fontSize: sizeToken.fontSize,
        paddingInline: `${sizeToken.paddingX}px`,
        borderRadius: `${radius.md}px`,
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
        transition: `background-color ${motion.base} ${motion.easeStandard}, border-color ${motion.base} ${motion.easeStandard}`,
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
        ...variantSx,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
});

export const Button = memo(ButtonImpl);
export default Button;
