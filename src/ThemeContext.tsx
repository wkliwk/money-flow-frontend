import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  ThemePreference,
  getStoredThemePreference,
  storeThemePreference,
  resolveTheme,
} from './theme';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
  isDark: true,
});

export const useThemePreference = (): ThemeContextValue => useContext(ThemeContext);

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(MEDIA_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    storeThemePreference(pref);
  }, []);

  const isDark = preference === 'system' ? systemDark : preference === 'dark';
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
