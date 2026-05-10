import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastProvider from '../ToastProvider';
import useToast from '../../../hooks/useToast';

const Consumer: React.FC<{ run: (toast: ReturnType<typeof useToast>) => void }> = ({ run }) => {
  const toast = useToast();
  return (
    <button type="button" onClick={() => run(toast)}>
      fire
    </button>
  );
};

describe('ToastProvider + useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('shows a success toast and auto-dismisses after 3s by default', () => {
    render(
      <ToastProvider>
        <Consumer run={(t) => t.success('Saved')} />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('fire'));
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(screen.queryByText('Saved')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('uses 6s for error variant', () => {
    render(
      <ToastProvider>
        <Consumer run={(t) => t.error('Boom')} />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('fire'));
    });
    act(() => {
      jest.advanceTimersByTime(5999);
    });
    expect(screen.getByText('Boom')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(screen.queryByText('Boom')).not.toBeInTheDocument();
  });

  it('renders an action button and invokes onClick when pressed (skipping onTimeout)', () => {
    const action = jest.fn();
    const onTimeout = jest.fn();
    render(
      <ToastProvider>
        <Consumer
          run={(t) =>
            t.success('Deleted "Coffee" (-$5)', {
              action: { label: 'Undo', onClick: action },
              onTimeout,
            })
          }
        />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('fire'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Undo'));
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Deleted "Coffee" (-$5)')).not.toBeInTheDocument();
    // onTimeout must NOT fire even after the duration elapses
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('fires onTimeout when the toast auto-dismisses', () => {
    const onTimeout = jest.fn();
    render(
      <ToastProvider>
        <Consumer run={(t) => t.success('Bye', { duration: 1000, onTimeout })} />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('fire'));
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('stacks multiple toasts (max 3, FIFO eviction)', () => {
    render(
      <ToastProvider>
        <Consumer
          run={(t) => {
            t.info('one');
            t.info('two');
            t.info('three');
            t.info('four');
          }}
        />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('fire'));
    });
    expect(screen.queryByText('one')).not.toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.getByText('four')).toBeInTheDocument();
  });

  it('throws when useToast is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Broken: React.FC = () => {
      useToast();
      return null;
    };
    expect(() => render(<Broken />)).toThrow(/useToast must be used inside/);
    spy.mockRestore();
  });
});
