import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingFlow, { isOnboardingComplete, markOnboardingComplete } from '../OnboardingFlow';

const renderOnboarding = (
  open = true,
  onDismiss = jest.fn(),
  onFabClick = jest.fn()
) =>
  render(
    <OnboardingFlow open={open} onDismiss={onDismiss} onFabClick={onFabClick} />
  );

describe('OnboardingFlow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isOnboardingComplete / markOnboardingComplete', () => {
    it('returns false when key is not set', () => {
      expect(isOnboardingComplete()).toBe(false);
    });

    it('returns true after markOnboardingComplete is called', () => {
      markOnboardingComplete();
      expect(isOnboardingComplete()).toBe(true);
    });
  });

  describe('Step 1 — Welcome', () => {
    it('renders the welcome title on first open', () => {
      renderOnboarding();
      expect(screen.getByText('Welcome to Money Flow')).toBeInTheDocument();
    });

    it('renders Skip button', () => {
      renderOnboarding();
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('renders Next button', () => {
      renderOnboarding();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('calls onDismiss when Skip is clicked', () => {
      const onDismiss = jest.fn();
      renderOnboarding(true, onDismiss);
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step 2 — Record expense', () => {
    it('advances to step 2 after clicking Next', () => {
      renderOnboarding();
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByText('Record your first expense')).toBeInTheDocument();
    });

    it('shows "Try it now" CTA on step 2', () => {
      renderOnboarding();
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      expect(screen.getByRole('button', { name: /open add expense form/i })).toBeInTheDocument();
    });

    it('calls onFabClick when "Try it now" is clicked', () => {
      const onFabClick = jest.fn();
      renderOnboarding(true, jest.fn(), onFabClick);
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      fireEvent.click(screen.getByRole('button', { name: /open add expense form/i }));
      expect(onFabClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step 3 — Scan receipt', () => {
    const advanceToStep3 = () => {
      renderOnboarding();
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
    };

    it('shows scan receipt title on step 3', () => {
      advanceToStep3();
      expect(screen.getByText('Scan a receipt')).toBeInTheDocument();
    });

    it('shows finish button on last step', () => {
      advanceToStep3();
      expect(screen.getByRole('button', { name: /finish onboarding/i })).toBeInTheDocument();
    });

    it('calls onDismiss when finish button is clicked', () => {
      const onDismiss = jest.fn();
      renderOnboarding(true, onDismiss);
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      fireEvent.click(screen.getByRole('button', { name: /next step/i }));
      fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Closed state', () => {
    it('does not render content when open is false', () => {
      renderOnboarding(false);
      expect(screen.queryByText('Welcome to Money Flow')).not.toBeInTheDocument();
    });
  });
});
