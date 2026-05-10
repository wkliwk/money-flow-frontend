import React, { forwardRef, memo } from 'react';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import { motion, radius } from './tokens';

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Visible label. */
  label: string;
  /** Whether the chip is currently selected. */
  selected?: boolean;
  /** Click handler. When provided the chip is rendered as a button. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Disable interaction. */
  disabled?: boolean;
}

/**
 * Chip — tag / category indicator matching the design-system spec.
 *
 * 24h, padding 4/10, radius `pill`, body-sm. Unselected: bg.subtle / fg.secondary.
 * Selected: primary-100 / primary-600. Renders as a button when `onClick` is
 * provided (toggle/filter chips), otherwise a static `span`.
 */
const ChipImpl = forwardRef<HTMLElement, ChipProps>(function Chip(
  { label, selected = false, onClick, disabled = false, ...rest },
  ref,
) {
  const theme = useTheme();
  const isInteractive = typeof onClick === 'function';

  const isDark = theme.palette.mode === 'dark';
  // Use the darker primary shade for selected fg on light bg, and the lighter
  // shade on dark bg, so the chip clears WCAG AA contrast against its tinted
  // background.
  const selectedBg = alpha(theme.palette.primary.main, isDark ? 0.22 : 0.18);
  const selectedFg = isDark
    ? theme.palette.primary.light ?? theme.palette.primary.main
    : theme.palette.primary.dark ?? theme.palette.primary.main;
  // Base chip uses a stronger surface and the primary text color so the
  // foreground clears WCAG AA contrast.
  const baseBg = isDark
    ? alpha(theme.palette.common.white, 0.12)
    : alpha(theme.palette.text.primary, 0.12);
  const baseFg = theme.palette.text.primary;

  const sharedSx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    paddingInline: '10px',
    paddingBlock: '4px',
    borderRadius: `${radius.pill}px`,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    backgroundColor: selected ? selectedBg : baseBg,
    color: selected ? selectedFg : baseFg,
    border: 'none',
    transition: `background-color ${motion.fast} ${motion.easeStandard}, color ${motion.fast} ${motion.easeStandard}`,
    cursor: isInteractive ? 'pointer' : 'default',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? ('none' as const) : ('auto' as const),
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
    ...(isInteractive && {
      '&:hover': {
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, isDark ? 0.32 : 0.26)
          : alpha(theme.palette.text.primary, isDark ? 0.18 : 0.18),
      },
    }),
  };

  if (isInteractive) {
    return (
      <Box
        ref={ref as React.Ref<HTMLButtonElement>}
        component="button"
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        disabled={disabled}
        sx={sharedSx}
        {...rest}
      >
        {label}
      </Box>
    );
  }

  return (
    <Box
      ref={ref as React.Ref<HTMLSpanElement>}
      component="span"
      sx={sharedSx}
    >
      {label}
    </Box>
  );
});

export const Chip = memo(ChipImpl);
export default Chip;
