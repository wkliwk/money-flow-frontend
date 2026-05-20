import { createTheme, Theme } from '@mui/material/styles';

// ── Design tokens ──────────────────────────────────────────────────────────
export const tokens = {
  // Surface / Background
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF9F6',
  border: '#E6E3DC',
  borderLight: '#F0EDE7',

  // Brand
  primary: '#5B4EC7',
  primaryHover: '#4C40AF',
  primaryLight: '#EEEDFC',
  primaryBorder: '#D4D0F0',
  primaryDark: '#1A1A2E',

  // Text
  text1: '#1C1917',
  text2: '#57534E',
  text3: '#A8A29E',
  text4: '#D6D3CD',

  // Semantic
  income: '#059669',
  incomeBg: '#ECFDF5',
  incomeBorder: '#86EFAC',
  expense: '#DC2626',
  expenseBg: '#FEF2F2',
  expenseBorder: '#FCA5A5',
  amber: '#D97706',
  amberBg: '#FFFBEB',

  // Fonts
  fontDisplay: "'Space Grotesk', sans-serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",

  // Shadows
  s1: '0 1px 2px rgba(0,0,0,0.04)',
  s2: '0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
  s3: '0 12px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
  sModal: '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
  sFab: '0 8px 24px rgba(91,78,199,0.3)',
} as const;

// ── Light theme (single theme — no dark mode) ──────────────────────────────
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: tokens.bg,
      paper: tokens.surface,
    },
    primary: {
      main: tokens.primary,
      light: tokens.primaryLight,
      dark: tokens.primaryHover,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tokens.income,
      contrastText: '#ffffff',
    },
    success: {
      main: tokens.income,
      light: '#86EFAC',
      dark: '#047857',
    },
    error: {
      main: tokens.expense,
      light: '#FCA5A5',
      dark: '#B91C1C',
    },
    warning: {
      main: tokens.amber,
      light: '#FDE68A',
    },
    text: {
      primary: tokens.text1,
      secondary: tokens.text2,
      disabled: tokens.text3,
    },
    divider: tokens.border,
  },
  typography: {
    fontFamily: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`,
    h1: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h4: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h5: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h6: {
      fontFamily: `'Space Grotesk', sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    subtitle1: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 600,
    },
    subtitle2: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    body1: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 400,
      fontSize: '0.875rem',
    },
    body2: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 400,
      fontSize: '0.8125rem',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 600,
      letterSpacing: '0',
      textTransform: 'none',
    },
    caption: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontSize: '0.6875rem',
    },
    overline: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontWeight: 600,
      letterSpacing: '0.06em',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: tokens.bg,
          color: tokens.text1,
          scrollbarColor: `${tokens.border} ${tokens.bg}`,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: tokens.bg },
          '&::-webkit-scrollbar-thumb': { background: tokens.border, borderRadius: '3px' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          boxShadow: tokens.s1,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
        },
        contained: {
          backgroundColor: tokens.primary,
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: tokens.primaryHover,
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: tokens.border,
          borderWidth: '1.5px',
          color: tokens.text1,
          '&:hover': {
            borderColor: tokens.primary,
            backgroundColor: tokens.primaryLight,
            borderWidth: '1.5px',
          },
        },
        text: {
          color: tokens.primary,
          '&:hover': { backgroundColor: tokens.primaryLight },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
          fontWeight: 500,
          fontSize: '0.8125rem',
          border: `1px solid ${tokens.border}`,
          backgroundColor: tokens.surfaceAlt,
          color: tokens.text2,
          '&.MuiChip-colorPrimary': {
            backgroundColor: tokens.primaryLight,
            color: tokens.primary,
            border: `1px solid ${tokens.primaryBorder}`,
          },
        },
        colorSuccess: {
          backgroundColor: tokens.incomeBg,
          color: tokens.income,
          border: `1px solid ${tokens.incomeBorder}`,
        },
        colorError: {
          backgroundColor: tokens.expenseBg,
          color: tokens.expense,
          border: `1px solid ${tokens.expenseBorder}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          borderBottom: `1px solid ${tokens.borderLight}`,
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
        },
        head: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: tokens.text3,
          backgroundColor: tokens.surfaceAlt,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: tokens.surfaceAlt },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            fontFamily: `'Plus Jakarta Sans', sans-serif`,
            '& fieldset': {
              borderColor: tokens.border,
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: tokens.primary,
              borderWidth: '1.5px',
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.primary,
              borderWidth: '1.5px',
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: `'Plus Jakarta Sans', sans-serif`,
            color: tokens.text3,
            '&.Mui-focused': { color: tokens.primary },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: 24,
          boxShadow: tokens.sModal,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.surface,
          borderBottom: `1px solid ${tokens.border}`,
          boxShadow: 'none',
          color: tokens.text1,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: tokens.primaryDark,
          border: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          borderTop: `1px solid ${tokens.border}`,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: tokens.text3,
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
          '&.Mui-selected': {
            color: tokens.primary,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.625rem',
            fontWeight: 400,
            '&.Mui-selected': {
              fontSize: '0.625rem',
              fontWeight: 600,
            },
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.primary,
          color: '#ffffff',
          boxShadow: tokens.sFab,
          '&:hover': {
            backgroundColor: tokens.primaryHover,
            boxShadow: tokens.sFab,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: tokens.surfaceAlt },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: tokens.border } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { gap: 6 },
        grouped: {
          margin: 0,
          '&:not(:first-of-type)': { borderRadius: '10px !important', marginLeft: 0 },
          '&:first-of-type': { borderRadius: '10px !important' },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px !important',
          textTransform: 'none' as const,
          fontWeight: 500,
          fontSize: '0.8rem',
          padding: '5px 14px',
          border: `1px solid ${tokens.border}`,
          color: tokens.text2,
          backgroundColor: tokens.surfaceAlt,
          '&.Mui-selected': {
            color: tokens.primary,
            backgroundColor: tokens.primaryLight,
            borderColor: `${tokens.primaryBorder} !important`,
            '&:hover': { backgroundColor: tokens.primaryLight },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '1px 10px',
          padding: '10px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(91,78,199,0.25)',
            '&:hover': { backgroundColor: 'rgba(91,78,199,0.3)' },
          },
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 36 },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: `'Plus Jakarta Sans', sans-serif`,
          fontSize: '0.875rem',
        },
      },
    },
  },
});

// Keep named exports for backward compat — both resolve to lightTheme
export const darkTheme: Theme = lightTheme;

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

export function resolveTheme(_pref: ThemePreference, _systemDark: boolean): Theme {
  return lightTheme;
}

export default lightTheme;
