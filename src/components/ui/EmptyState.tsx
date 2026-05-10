import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { spacing } from './tokens';
import Button from './Button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  /** Custom icon node. Rendered at 48px, color `fg.muted`. */
  icon?: React.ReactNode;
  /** Headline — `h2`, max-width 280. */
  title: string;
  /** Supporting copy — `body`, max-width 320, centered. */
  body?: string;
  /** Primary CTA (single action). */
  cta?: EmptyStateAction;
  /** Optional ghost-style secondary CTA. */
  secondaryCta?: EmptyStateAction;
  /** Override container test id (useful for showcase). */
  'data-testid'?: string;
}

/**
 * EmptyState — pattern matching patterns.md spec.
 *
 * Centered: 48px icon (fg.muted) → h2 headline → body fg.secondary → primary CTA.
 * Min vertical padding `3xl`. Use for: dashboard empty, transactions list,
 * reports no-data, tags empty.
 */
const EmptyStateImpl: React.FC<EmptyStateProps> = ({
  icon,
  title,
  body,
  cta,
  secondaryCta,
  'data-testid': dataTestId,
}) => {
  const theme = useTheme();
  return (
    <Box
      data-testid={dataTestId}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingBlock: `${spacing['3xl']}px`,
        paddingInline: `${spacing.lg}px`,
        gap: `${spacing.md}px`,
      }}
    >
      {icon ? (
        <Box
          aria-hidden="true"
          sx={{
            color: theme.palette.text.disabled,
            display: 'inline-flex',
            fontSize: 48,
            '& > svg': { fontSize: 48 },
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Typography
        component="h2"
        sx={{
          fontSize: 20,
          fontWeight: 600,
          lineHeight: '28px',
          color: theme.palette.text.primary,
          maxWidth: 280,
        }}
      >
        {title}
      </Typography>
      {body ? (
        <Typography
          sx={{
            fontSize: 16,
            lineHeight: '24px',
            color: theme.palette.text.secondary,
            maxWidth: 320,
          }}
        >
          {body}
        </Typography>
      ) : null}
      {(cta || secondaryCta) && (
        <Box
          sx={{
            display: 'flex',
            gap: `${spacing.sm}px`,
            marginTop: `${spacing.sm}px`,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {cta ? (
            <Button variant="primary" size="md" onClick={cta.onClick}>
              {cta.label}
            </Button>
          ) : null}
          {secondaryCta ? (
            <Button variant="ghost" size="md" onClick={secondaryCta.onClick}>
              {secondaryCta.label}
            </Button>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export const EmptyState = memo(EmptyStateImpl);
export default EmptyState;
