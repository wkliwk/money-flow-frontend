import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initAnalytics(): void {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
  });
}

export function identifyUser(userId: string): void {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId);
}

export function trackAppOpened(): void {
  if (!POSTHOG_KEY) return;
  posthog.capture('app_opened');
}

export function trackTransactionAdded(type: string): void {
  if (!POSTHOG_KEY) return;
  posthog.capture('transaction_added', { type });
}

export function trackTransactionEdited(): void {
  if (!POSTHOG_KEY) return;
  posthog.capture('transaction_edited');
}

export function trackTransactionDeleted(): void {
  if (!POSTHOG_KEY) return;
  posthog.capture('transaction_deleted');
}

export function trackMonthChanged(direction: 'prev' | 'next'): void {
  if (!POSTHOG_KEY) return;
  posthog.capture('month_changed', { direction });
}
