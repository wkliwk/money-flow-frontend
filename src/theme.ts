import { createTheme, Theme } from '@mui/material/styles';

const sharedTypography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h4: { fontWeight: 700, letterSpacing: '-0.02em' },
  h5: { fontWeight: 700, letterSpacing: '-0.02em' },
  h6: { fontWeight: 600, letterSpacing: '-0.01em' },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600, letterSpacing: '0.02em' },
  body2: { lineHeight: 1.6 },
  button: { fontWeight: 600, letterSpacing: '0.02em' },
};

const sharedShape = { borderRadius: 12 };

const sharedComponents = {
  MuiPaper: {
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 8, textTransform: 'none' as const, fontWeight: 600 },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { padding: '14px 16px' },
      head: {
        fontWeight: 600,
        fontSize: '0.7rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        backgroundColor: 'transparent',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: { root: { transition: 'background-color 0.15s ease' } },
  },
  MuiIconButton: {
    styleOverrides: { root: { borderRadius: 8, transition: 'background-color 0.15s ease' } },
  },
  MuiAlert: {
    styleOverrides: { root: { borderRadius: 8 } },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: { gap: 6 },
      grouped: {
        margin: 0,
        '&:not(:first-of-type)': { borderRadius: '8px !important', marginLeft: 0 },
        '&:first-of-type': { borderRadius: '8px !important' },
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px !important',
        textTransform: 'none' as const,
        fontWeight: 500,
        fontSize: '0.8rem',
        padding: '5px 14px',
        '&.Mui-selected': {
          color: '#818cf8',
          backgroundColor: 'rgba(129, 140, 248, 0.12)',
          borderColor: 'rgba(129, 140, 248, 0.3) !important',
          '&:hover': { backgroundColor: 'rgba(129, 140, 248, 0.18)' },
        },
      },
    },
  },
};

export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0f172a', paper: '#1e293b' },
    primary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1', contrastText: '#ffffff' },
    secondary: { main: '#34d399', contrastText: '#ffffff' },
    success: { main: '#34d399', light: '#6ee7b7', dark: '#10b981' },
    error: { main: '#fb7185', light: '#fda4af', dark: '#f43f5e' },
    warning: { main: '#fbbf24' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    divider: 'rgba(148, 163, 184, 0.1)',
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#0f172a',
          scrollbarColor: '#334155 #0f172a',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#0f172a' },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: '3px' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...sharedComponents.MuiButton.styleOverrides,
        contained: {
          boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)',
          '&:hover': { boxShadow: '0 0 28px rgba(129, 140, 248, 0.45)' },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          '&:hover': { borderColor: '#818cf8', backgroundColor: 'rgba(129, 140, 248, 0.08)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        ...sharedComponents.MuiChip.styleOverrides,
        colorSuccess: {
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(52, 211, 153, 0.25)',
        },
        colorError: {
          backgroundColor: 'rgba(251, 113, 133, 0.15)',
          color: '#fb7185',
          border: '1px solid rgba(251, 113, 133, 0.25)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { ...sharedComponents.MuiTableCell.styleOverrides.root, borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
        head: { ...sharedComponents.MuiTableCell.styleOverrides.head, color: '#64748b' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { ...sharedComponents.MuiTableRow.styleOverrides.root, '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.04)' } },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
            '&.Mui-focused fieldset': { borderColor: '#818cf8' },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          ...sharedComponents.MuiToggleButton.styleOverrides.root,
          border: '1px solid rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        ...sharedComponents.MuiToggleButtonGroup.styleOverrides,
        grouped: {
          ...sharedComponents.MuiToggleButtonGroup.styleOverrides.grouped,
          '&:not(:first-of-type)': {
            ...sharedComponents.MuiToggleButtonGroup.styleOverrides.grouped['&:not(:first-of-type)'],
            borderLeft: '1px solid rgba(148, 163, 184, 0.15) !important',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { ...sharedComponents.MuiIconButton.styleOverrides.root, '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.08)' } },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(148, 163, 184, 0.08)' } },
    },
  },
});

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#f8fafc', paper: '#ffffff' },
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#ffffff' },
    secondary: { main: '#10b981', contrastText: '#ffffff' },
    success: { main: '#10b981', light: '#34d399', dark: '#059669' },
    error: { main: '#f43f5e', light: '#fb7185', dark: '#e11d48' },
    warning: { main: '#f59e0b' },
    text: { primary: '#1e293b', secondary: '#64748b' },
    divider: 'rgba(100, 116, 139, 0.12)',
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#f8fafc',
          scrollbarColor: '#cbd5e1 #f8fafc',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f8fafc' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '3px' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(248, 250, 252, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
          boxShadow: 'none',
          color: '#1e293b',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(100, 116, 139, 0.12)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...sharedComponents.MuiButton.styleOverrides,
        contained: {
          boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)',
          '&:hover': { boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)' },
        },
        outlined: {
          borderColor: 'rgba(100, 116, 139, 0.25)',
          '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.06)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        ...sharedComponents.MuiChip.styleOverrides,
        colorSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        },
        colorError: {
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          color: '#e11d48',
          border: '1px solid rgba(244, 63, 94, 0.25)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { ...sharedComponents.MuiTableCell.styleOverrides.root, borderBottom: '1px solid rgba(100, 116, 139, 0.1)' },
        head: { ...sharedComponents.MuiTableCell.styleOverrides.head, color: '#64748b' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { ...sharedComponents.MuiTableRow.styleOverrides.root, '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.04)' } },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(100, 116, 139, 0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(100, 116, 139, 0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1' },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(100, 116, 139, 0.12)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          ...sharedComponents.MuiToggleButton.styleOverrides.root,
          border: '1px solid rgba(100, 116, 139, 0.2)',
          color: '#64748b',
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        ...sharedComponents.MuiToggleButtonGroup.styleOverrides,
        grouped: {
          ...sharedComponents.MuiToggleButtonGroup.styleOverrides.grouped,
          '&:not(:first-of-type)': {
            ...sharedComponents.MuiToggleButtonGroup.styleOverrides.grouped['&:not(:first-of-type)'],
            borderLeft: '1px solid rgba(100, 116, 139, 0.2) !important',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { ...sharedComponents.MuiIconButton.styleOverrides.root, '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.08)' } },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(100, 116, 139, 0.1)' } },
    },
  },
});

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mf_theme';

export function getStoredThemePreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function storeThemePreference(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, pref);
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): Theme {
  if (pref === 'system') return systemDark ? darkTheme : lightTheme;
  return pref === 'dark' ? darkTheme : lightTheme;
}

export default darkTheme;
