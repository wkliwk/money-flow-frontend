import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastProvider from '../ToastProvider';
import { emitToast } from '../../../toastEvents';

describe('ToastProvider', () => {
  it('renders children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows a toast when emitToast is called', async () => {
    render(
      <ToastProvider>
        <div>App</div>
      </ToastProvider>
    );

    act(() => {
      emitToast('Something went wrong', 'error');
    });

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('can be manually dismissed', async () => {
    render(
      <ToastProvider>
        <div>App</div>
      </ToastProvider>
    );

    act(() => {
      emitToast('Dismissable toast', 'warning');
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument();
    });
  });
});
