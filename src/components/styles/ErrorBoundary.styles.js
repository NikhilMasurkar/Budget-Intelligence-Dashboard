import { makeStyles } from 'tss-react/mui'

// Styles for ErrorBoundary.jsx.
export const useErrorBoundaryUi = makeStyles()((theme) => ({
  box1: {
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  typography1: {
    marginBottom: theme.spacing(1),
    color: 'var(--danger-soft)',
  },
  typography2: {
    marginBottom: theme.spacing(2),
    color: 'var(--text2)',
  },
  button1: {
    color: 'var(--accent)',
    borderColor: 'var(--accent)',
  },
}))
