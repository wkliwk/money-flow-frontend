import React from 'react';
import { render, screen } from '@testing-library/react';
import ManageItemsPage from '../ManageItemsPage';

jest.mock('../../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({
    presets: {},
    setPreset: jest.fn(),
    deletePreset: jest.fn(),
  }),
}));

describe('ManageItemsPage', () => {
  it('renders without crashing', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Item Presets')).toBeInTheDocument();
  });

  it('shows Expense Items section', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Expense Items')).toBeInTheDocument();
  });

  it('shows Income Items section', () => {
    render(<ManageItemsPage />);
    expect(screen.getByText('Income Items')).toBeInTheDocument();
  });
});
