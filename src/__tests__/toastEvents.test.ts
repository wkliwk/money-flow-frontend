import { emitToast, subscribeToast } from '../toastEvents';

describe('toastEvents', () => {
  it('notifies subscribers when a toast is emitted', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToast(listener);

    emitToast('Test message', 'error');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ message: 'Test message', severity: 'error' });

    unsubscribe();
  });

  it('does not notify after unsubscribing', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToast(listener);

    unsubscribe();
    emitToast('Should not see this', 'info');

    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsub1 = subscribeToast(listener1);
    const unsub2 = subscribeToast(listener2);

    emitToast('Broadcast', 'warning');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it('defaults severity to error', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToast(listener);

    emitToast('Default severity');

    expect(listener).toHaveBeenCalledWith({ message: 'Default severity', severity: 'error' });

    unsubscribe();
  });
});
