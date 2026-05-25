import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsSection from '../SettingsSection';
import SettingsProfile from '../SettingsProfile';

describe('SettingsSection', () => {
  it('renders uppercase title', () => {
    render(<SettingsSection title="Appearance">content</SettingsSection>);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders children inside the card', () => {
    render(
      <SettingsSection title="Data">
        <div data-testid="child-content">payload</div>
      </SettingsSection>
    );
    expect(screen.getByTestId('child-content')).toHaveTextContent('payload');
  });

  it('renders an optional description below the card', () => {
    render(
      <SettingsSection title="Data" description="Manage your saved data.">
        x
      </SettingsSection>
    );
    expect(screen.getByText('Manage your saved data.')).toBeInTheDocument();
  });

  it('does not render a description element when none provided', () => {
    render(<SettingsSection title="X">x</SettingsSection>);
    expect(screen.queryByText(/manage your/i)).toBeNull();
  });
});

describe('SettingsProfile', () => {
  it('renders the email when provided', () => {
    render(<SettingsProfile email="alice@example.com" userId="abc123" />);
    expect(screen.getByTestId('settings-profile-card')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText(/ID · abc123/)).toBeInTheDocument();
  });

  it('falls back to "Your account" when email is missing', () => {
    render(<SettingsProfile userId="abc123" />);
    expect(screen.getByText('Your account')).toBeInTheDocument();
  });

  it('uses email-derived initials for the avatar', () => {
    render(<SettingsProfile email="rickylee@example.com" userId="x" />);
    expect(screen.getByText('RI')).toBeInTheDocument();
  });

  it('is non-interactive without onClick', () => {
    render(<SettingsProfile email="a@b.com" />);
    const card = screen.getByTestId('settings-profile-card');
    expect(card.getAttribute('role')).toBeNull();
  });

  it('becomes a button with chevron when onClick is provided', () => {
    const onClick = jest.fn();
    render(<SettingsProfile email="a@b.com" onClick={onClick} />);
    const card = screen.getByRole('button');
    card.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
