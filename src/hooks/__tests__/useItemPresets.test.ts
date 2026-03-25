import { renderHook, act } from '@testing-library/react';
import { useItemPresets } from '../useItemPresets';

describe('useItemPresets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty presets', () => {
    const { result } = renderHook(() => useItemPresets());
    expect(result.current.presets).toEqual({});
  });

  it('setPreset stores a description for an item', () => {
    const { result } = renderHook(() => useItemPresets());
    act(() => {
      result.current.setPreset('Coffee', 'Morning latte');
    });
    expect(result.current.presets['Coffee']).toBe('Morning latte');
  });

  it('deletePreset removes item preset', () => {
    const { result } = renderHook(() => useItemPresets());
    act(() => {
      result.current.setPreset('Coffee', 'Morning latte');
    });
    act(() => {
      result.current.deletePreset('Coffee');
    });
    expect(result.current.presets['Coffee']).toBeUndefined();
  });

  it('persists presets to localStorage', () => {
    const { result } = renderHook(() => useItemPresets());
    act(() => {
      result.current.setPreset('Taxi', 'Work commute');
    });
    const stored = JSON.parse(localStorage.getItem('mf_item_presets') || '{}');
    expect(stored['Taxi']).toBe('Work commute');
  });
});
