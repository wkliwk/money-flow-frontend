import { useState, useCallback } from 'react';

const KEY = 'mf_item_presets';

function load(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function useItemPresets() {
  const [presets, setPresetsState] = useState<Record<string, string>>(load);

  const setPreset = useCallback((item: string, description: string) => {
    setPresetsState((prev) => {
      const next = { ...prev, [item]: description };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deletePreset = useCallback((item: string) => {
    setPresetsState((prev) => {
      const next = { ...prev };
      delete next[item];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { presets, setPreset, deletePreset };
}
