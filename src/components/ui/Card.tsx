import React, { forwardRef, memo } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { motion, radius, spacing } from './tokens';

export interface CardProps extends BoxProps {
  /** When true, the card responds to hover with a stronger shadow. */
  interactive?: boolean;
  /** Render as a `button` semantically. Sets role + interactive shadow. */
  asButton?: boolean;
}

/**
 * Card — surface container matching the design-system spec.
 *
 * bg.surface, radius `lg`, padding `lg`, shadow `sm`. Hover (clickable):
 * shadow `md`. Use `interactive` or `asButton` for clickable cards.
 */
const CardImpl = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, asButton = false, sx, children, ...rest },
  ref,
) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shadowSm = isDark
    ? '0 1px 2px rgba(0, 0, 0, 0.4)'
    : '0 1px 2px rgba(15, 23, 42, 0.06)';
  const shadowMd = isDark
    ? '0 4px 12px rgba(0, 0, 0, 0.5)'
    : '0 4px 12px rgba(15, 23, 42, 0.08)';
  const hoverable = interactive || asButton;

  return (
    <Box
      ref={ref}
      component={asButton ? 'button' : 'div'}
      {...(asButton ? { type: 'button' } : {})}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: `${radius.lg}px`,
        padding: `${spacing.lg}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: shadowSm,
        transition: `box-shadow ${motion.base} ${motion.easeStandard}, transform ${motion.fast} ${motion.easeStandard}`,
        textAlign: 'left',
        ...(asButton && {
          font: 'inherit',
          color: 'inherit',
          cursor: 'pointer',
          width: '100%',
        }),
        ...(hoverable && {
          '&:hover': { boxShadow: shadowMd },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        }),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
});

export const Card = memo(CardImpl);
export default Card;
