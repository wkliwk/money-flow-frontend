/**
 * Design tokens for Money Flow UI primitives.
 *
 * Spec source: /tmp/mf-design-redesign/design-system.md
 *
 * These tokens are the canonical reference for the UI library. They mirror the
 * semantic tokens documented in the design system and are consumed by the
 * Button/Input/Card/Chip/EmptyState components below.
 *
 * When `src/theme.ts` is updated (issue #279) to expose these as theme tokens,
 * components should switch to `theme.palette.*` / `theme.spacing(...)` and this
 * file becomes redundant. Until then, components use these constants so the
 * library is decoupled from the current ad-hoc theme.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 9999,
} as const;

export const motion = {
  fast: '120ms',
  base: '200ms',
  slow: '320ms',
  easeStandard: 'cubic-bezier(.2,.8,.2,1)',
  easeInOut: 'cubic-bezier(.4,0,.6,1)',
} as const;

export const buttonSize = {
  sm: { height: 32, fontSize: 12, paddingX: 12 },
  md: { height: 40, fontSize: 14, paddingX: 16 },
  lg: { height: 48, fontSize: 16, paddingX: 20 },
} as const;

export type ButtonSizeToken = keyof typeof buttonSize;
