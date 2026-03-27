import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceiptScanButton from '../ReceiptScanButton';

describe('ReceiptScanButton', () => {
  it('renders the scan button', () => {
    render(<ReceiptScanButton onFileSelected={jest.fn()} loading={false} />);
    expect(screen.getByRole('button', { name: /scan receipt/i })).toBeInTheDocument();
  });

  it('shows spinner and loading text when loading', () => {
    render(<ReceiptScanButton onFileSelected={jest.fn()} loading={true} />);
    expect(screen.getByText('Scanning receipt...')).toBeInTheDocument();
    // Button is disabled while loading
    expect(screen.getByRole('button', { name: /scan receipt/i })).toBeDisabled();
  });

  it('calls onFileSelected when a file is chosen', () => {
    const onFileSelected = jest.fn();
    render(<ReceiptScanButton onFileSelected={onFileSelected} loading={false} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('does not call onFileSelected when no file is provided', () => {
    const onFileSelected = jest.fn();
    render(<ReceiptScanButton onFileSelected={onFileSelected} loading={false} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('has capture=environment attribute for mobile camera', () => {
    render(<ReceiptScanButton onFileSelected={jest.fn()} loading={false} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute('capture')).toBe('environment');
    expect(input.getAttribute('accept')).toBe('image/*');
  });
});
