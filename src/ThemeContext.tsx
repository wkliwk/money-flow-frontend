import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  ThemePreference,
  getStoredThemePreference,
  storeThemePreference,
  resolveTheme,
} from './theme';
import { getToken } from './services/auth';
import { getUserMe, patchUserPreferences } from './services/api';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'light',
  setPreference: () => {},
  isDark: false,
});

export const useThemePreference = (): ThemeContextValue => useContext(ThemeContext);

const MEDIA_QUERY = '(prefers-color-scheme: dark)';
const DEBOUNCE_MS = 500;

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(MEDIA_QUERY).matches);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch theme preference from backend on mount if user is authenticated.
  useEffect(() => {
    if (!getToken()) return;
    getUserMe()
      .then((user) => {
        if (user.themePreference) {
          setPreferenceState(user.themePreference);
          storeThemePreference(user.themePreference);
        }
      })
      .catch(() => {
        // Silently fall back to localStorage value already in state
      });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    storeThemePreference(pref);

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!getToken()) return;
      patchUserPreferences({ themePreference: pref }).catch((err: unknown) => {
        console.error('[ThemeContext] Failed to persist theme preference:', err);
      });
    }, DEBOUNCE_MS);
  }, []);

  // isDark reflects the effective color mode based on user preference + system setting.
  // resolveTheme always returns lightTheme (light-only design), but isDark is still
  // computed accurately so consumers of ThemeContext get correct semantic state.
  const isDark = preference === 'dark' || (preference === 'system' && systemDark);
  const theme = useMemo(() => resolveTheme(preference, systemDark), [preference, systemDark]);

  const value = useMemo(() => ({ preference, setPreference, isDark }), [preference, setPreference, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
