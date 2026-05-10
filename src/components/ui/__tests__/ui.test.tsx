import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '../../../theme';
import { Button, Card, Chip, EmptyState, Input } from '../index';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

describe('UI primitives', () => {
  describe('Button', () => {
    it('renders all variants', () => {
      wrap(
        <>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </>,
      );
      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ghost' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Destructive' })).toBeInTheDocument();
    });

    it('fires onClick when not disabled', () => {
      const onClick = jest.fn();
      wrap(<Button onClick={onClick}>Click</Button>);
      fireEvent.click(screen.getByRole('button', { name: 'Click' }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire onClick when disabled', () => {
      const onClick = jest.fn();
      wrap(
        <Button onClick={onClick} disabled>
          Click
        </Button>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Click' }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Input', () => {
    it('renders the label and helper text', () => {
      wrap(<Input label="Email" helperText="We'll never share" onChange={() => undefined} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText("We'll never share")).toBeInTheDocument();
    });

    it('shows error text in place of helper text when error is true', () => {
      wrap(
        <Input
          label="Email"
          helperText="hint"
          error
          errorText="Required"
          onChange={() => undefined}
        />,
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.queryByText('hint')).not.toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      wrap(<Card>card body</Card>);
      expect(screen.getByText('card body')).toBeInTheDocument();
    });

    it('renders as a button when asButton', () => {
      const onClick = jest.fn();
      wrap(
        <Card asButton onClick={onClick}>
          Tap me
        </Card>,
      );
      const btn = screen.getByRole('button', { name: 'Tap me' });
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chip', () => {
    it('renders as a static span by default', () => {
      wrap(<Chip label="Static" />);
      expect(screen.getByText('Static')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders as a toggle button when onClick is provided', () => {
      const onClick = jest.fn();
      wrap(<Chip label="Food" selected onClick={onClick} />);
      const btn = screen.getByRole('button', { name: 'Food' });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState', () => {
    it('renders title, body and CTA', () => {
      const cta = jest.fn();
      wrap(
        <EmptyState
          title="Nothing here"
          body="Start by adding one."
          cta={{ label: 'Add', onClick: cta }}
        />,
      );
      expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
      expect(screen.getByText('Start by adding one.')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(cta).toHaveBeenCalledTimes(1);
    });

    it('renders without a CTA', () => {
      wrap(<EmptyState title="Empty" />);
      expect(screen.getByRole('heading', { name: 'Empty' })).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
