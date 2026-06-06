import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import OnboardingWizard, { isWizardComplete, markWizardComplete } from '../OnboardingWizard';

const mockCreateExpense = jest.fn().mockResolvedValue({ _id: 'e1' });

jest.mock('../../../services/api', () => ({
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  getExchangeRates: jest.fn().mockResolvedValue({}),
}));

const renderWizard = (open = true, onDismiss = jest.fn()) =>
  render(<OnboardingWizard open={open} onDismiss={onDismiss} />);

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('isWizardComplete / markWizardComplete', () => {
    it('returns false when mf_onboarded is not set', () => {
      expect(isWizardComplete()).toBe(false);
    });

    it('returns true after markWizardComplete is called', () => {
      markWizardComplete();
      expect(isWizardComplete()).toBe(true);
    });

    it('also sets mf_onboarding_complete when marking complete', () => {
      markWizardComplete();
      expect(localStorage.getItem('mf_onboarding_complete')).toBe('true');
    });
  });

  describe('Step 1 — Welcome', () => {
    it('renders welcome title', () => {
      renderWizard();
      expect(screen.getByText('Welcome to Money Flow')).toBeInTheDocument();
    });

    it('renders Get Started button', () => {
      renderWizard();
      expect(screen.getByRole('button', { name: /start setup/i })).toBeInTheDocument();
    });

    it('advances to step 2 on Get Started click', () => {
      renderWizard();
      fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
      expect(screen.getByText('Set your currency')).toBeInTheDocument();
    });

    it('does not render content when open is false', () => {
      renderWizard(false);
      expect(screen.queryByText('Welcome to Money Flow')).not.toBeInTheDocument();
    });
  });

  describe('Step 2 — Currency', () => {
    const goToStep2 = () => {
      renderWizard();
      fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
    };

    it('shows currency selector', () => {
      goToStep2();
      expect(screen.getByText('Set your currency')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders Next button', () => {
      goToStep2();
      expect(screen.getByRole('button', { name: /save currency and continue/i })).toBeInTheDocument();
    });

    it('renders Skip button', () => {
      goToStep2();
      expect(screen.getByRole('button', { name: /skip currency setup/i })).toBeInTheDocument();
    });

    it('saves currency to localStorage on Next click', () => {
      goToStep2();
      fireEvent.click(screen.getByRole('button', { name: /save currency and continue/i }));
      expect(localStorage.getItem('mf_currency')).not.toBeNull();
    });

    it('advances to step 3 on Next click', () => {
      goToStep2();
      fireEvent.click(screen.getByRole('button', { name: /save currency and continue/i }));
      expect(screen.getByText('Add your first expense')).toBeInTheDocument();
    });

    it('skips to step 4 when Skip is clicked', () => {
      goToStep2();
      fireEvent.click(screen.getByRole('button', { name: /skip currency setup/i }));
      expect(screen.getByText("You're all set!")).toBeInTheDocument();
    });
  });

  describe('Step 3 — Add expense', () => {
    const goToStep3 = () => {
      renderWizard();
      fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
      fireEvent.click(screen.getByRole('button', { name: /save currency and continue/i }));
    };

    it('shows amount field', () => {
      goToStep3();
      expect(screen.getByRole('spinbutton', { name: /expense amount/i })).toBeInTheDocument();
    });

    it('shows description field', () => {
      goToStep3();
      expect(screen.getByRole('textbox', { name: /expense description/i })).toBeInTheDocument();
    });

    it('shows Skip button', () => {
      goToStep3();
      expect(screen.getByRole('button', { name: /skip adding expense/i })).toBeInTheDocument();
    });

    it('shows Add & Continue button', () => {
      goToStep3();
      expect(screen.getByRole('button', { name: /add expense and continue/i })).toBeInTheDocument();
    });

    it('shows validation error when amount is empty', async () => {
      goToStep3();
      fireEvent.click(screen.getByRole('button', { name: /add expense and continue/i }));
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      });
    });

    it('calls createExpense and advances to step 4 on valid input', async () => {
      goToStep3();
      fireEvent.change(screen.getByRole('spinbutton', { name: /expense amount/i }), {
        target: { value: '50' },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /add expense and continue/i }));
      });
      await waitFor(() => {
        expect(mockCreateExpense).toHaveBeenCalledTimes(1);
        expect(screen.getByText("You're all set!")).toBeInTheDocument();
      });
    });

    it('skips to step 4 without API call when Skip is clicked', async () => {
      goToStep3();
      fireEvent.click(screen.getByRole('button', { name: /skip adding expense/i }));
      await waitFor(() => {
        expect(screen.getByText("You're all set!")).toBeInTheDocument();
      });
      expect(mockCreateExpense).not.toHaveBeenCalled();
    });
  });

  describe('Step 4 — Done', () => {
    const goToStep4 = () => {
      renderWizard();
      fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
      fireEvent.click(screen.getByRole('button', { name: /skip currency setup/i }));
    };

    it('shows completion message', () => {
      goToStep4();
      expect(screen.getByText("You're all set!")).toBeInTheDocument();
    });

    it('renders Go to Dashboard button', () => {
      goToStep4();
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('calls onDismiss and sets mf_onboarded when Go to Dashboard is clicked', () => {
      const onDismiss = jest.fn();
      render(<OnboardingWizard open onDismiss={onDismiss} />);
      fireEvent.click(screen.getByRole('button', { name: /start setup/i }));
      fireEvent.click(screen.getByRole('button', { name: /skip currency setup/i }));
      fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('mf_onboarded')).toBe('true');
    });
  });
});
