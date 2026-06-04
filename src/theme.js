import { createTheme } from '@mui/material/styles'

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5b7fff', // --accent
    },
    secondary: {
      main: '#3de8a0', // --accent2
    },
    error: {
      main: '#ff5f5f', // --danger
    },
    warning: {
      main: '#ffb347', // --warn
    },
    background: {
      default: '#101218', // --bg / --surface
      paper: '#181b28',   // --surface2
    },
    text: {
      primary: '#e4e8f5',   // --text
      secondary: '#8891b8', // --text2
      disabled: '#484f72',  // --text3
    },
    divider: 'rgba(255, 255, 255, 0.07)', // --border
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
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backgroundColor: '#181b28',
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
          border: '1px solid rgba(255, 255, 255, 0.13)',
          backgroundColor: '#101218',
        },
      },
    },
  },
})
