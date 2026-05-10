import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Button, Card, Chip, EmptyState, Input } from 'src/components/ui';

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
  id,
  title,
  children,
}) => (
  <Box component="section" aria-labelledby={`${id}-heading`} sx={{ mb: 6 }}>
    <Typography
      id={`${id}-heading`}
      component="h2"
      sx={{ fontSize: 20, fontWeight: 600, mb: 2 }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

const ComponentsPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [errorValue, setErrorValue] = useState('not-an-email');
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set(['Food']));

  const toggleChip = (label: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <Box
      component="main"
      sx={{
        maxWidth: 960,
        marginInline: 'auto',
        paddingBlock: 6,
        paddingInline: 3,
      }}
    >
      <Box component="header" sx={{ mb: 5 }}>
        <Typography component="h1" sx={{ fontSize: 32, fontWeight: 700, mb: 1 }}>
          Money Flow — UI primitives
        </Typography>
        <Typography sx={{ fontSize: 16, color: 'text.secondary' }}>
          Showcase of Button, Input, Card, Chip and EmptyState matching the design-system spec.
        </Typography>
      </Box>

      <Section id="button" title="Button">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Stack>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="primary" disabled>Disabled primary</Button>
            <Button variant="secondary" disabled>Disabled secondary</Button>
            <Button variant="destructive" disabled>Disabled destructive</Button>
          </Stack>
        </Stack>
      </Section>

      <Section id="input" title="Input">
        <Stack spacing={3} sx={{ maxWidth: 420 }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="We'll never share this."
          />
          <Input
            label="Password"
            type="password"
            value=""
            onChange={() => undefined}
          />
          <Input
            label="Invalid email"
            value={errorValue}
            onChange={(e) => setErrorValue(e.target.value)}
            error
            errorText="Enter a valid email address."
          />
          <Input label="Disabled" value="read only" disabled onChange={() => undefined} />
        </Stack>
      </Section>

      <Section id="card" title="Card">
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Card sx={{ minWidth: 240 }}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 1 }}>
              This month
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>$1,248.50</Typography>
          </Card>
          <Card interactive sx={{ minWidth: 240 }} tabIndex={0}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 1 }}>
              Interactive (hover/focus)
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>$420.00</Typography>
          </Card>
          <Card asButton onClick={() => undefined} sx={{ minWidth: 240 }}>
            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 1 }}>
              Clickable card
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>View report</Typography>
          </Card>
        </Stack>
      </Section>

      <Section id="chip" title="Chip">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Static" />
            <Chip label="Selected static" selected />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['Food', 'Transport', 'Bills', 'Fun'].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={selectedChips.has(label)}
                onClick={() => toggleChip(label)}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Disabled" disabled onClick={() => undefined} />
            <Chip label="Disabled selected" disabled selected onClick={() => undefined} />
          </Stack>
        </Stack>
      </Section>

      <Section id="empty-state" title="EmptyState">
        <Card>
          <EmptyState
            data-testid="empty-state-showcase"
            icon={<ReceiptLongIcon />}
            title="No transactions yet"
            body="Track your first expense to see your spending here."
            cta={{ label: 'Add transaction', onClick: () => undefined }}
            secondaryCta={{ label: 'Import CSV', onClick: () => undefined }}
          />
        </Card>
      </Section>
    </Box>
  );
};

export default ComponentsPage;
