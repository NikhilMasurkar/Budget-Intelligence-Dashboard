import { createTheme } from '@mui/material/styles'
import { palettes } from './tokens'

// MUI needs real hex here (it derives hover/alpha shades from them).
const build = (mode, t) => createTheme({
  palette: {
    mode,
    primary: { main: t.accent },
    secondary: { main: t.accent2 },
    error: { main: t.danger },
    warning: { main: t.warn },
    background: { default: t.bg, paper: t.surface2 },
    text: { primary: t.text, secondary: t.text2, disabled: t.text3 },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.09)',
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface2)',
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
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid var(--border2)',
          backgroundColor: 'var(--bg)',
        },
      },
    },
  },
})

export const themes = { dark: build('dark', palettes.dark), light: build('light', palettes.light) }
