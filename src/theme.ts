import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    primary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#34d399',
      contrastText: '#ffffff',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
    },
    error: {
      main: '#fb7185',
      light: '#fda4af',
      dark: '#f43f5e',
    },
    warning: {
      main: '#fbbf24',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.1)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: '0.02em' },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#0f172a',
          scrollbarColor: '#334155 #0f172a',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#0f172a' },
          '&::-webkit-scrollbar-thumb': {
            background: '#334155',
            borderRadius: '3px',
          },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)',
          '&:hover': {
            boxShadow: '0 0 28px rgba(129, 140, 248, 0.45)',
          },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          '&:hover': {
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.72rem',
        },
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
        root: {
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          padding: '14px 16px',
        },
        head: {
          color: '#64748b',
          fontWeight: 600,
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(148, 163, 184, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#818cf8',
            },
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
          borderRadius: '8px !important',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          padding: '5px 14px',
          color: '#94a3b8',
          '&.Mui-selected': {
            color: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.12)',
            borderColor: 'rgba(129, 140, 248, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(129, 140, 248, 0.18)',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(148, 163, 184, 0.08)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(148, 163, 184, 0.08)',
        },
      },
    },
  },
});

export default theme;
