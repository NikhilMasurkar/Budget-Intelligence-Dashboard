import { makeStyles } from 'tss-react/mui'

// Styles for ErrorBoundary.jsx.
export const useErrorBoundaryUi = makeStyles()((theme) => ({
  fallback: {
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  title: {
    marginBottom: theme.spacing(1),
    color: 'var(--danger-soft)',
  },
  message: {
    marginBottom: theme.spacing(2),
    color: 'var(--text2)',
  },
  retryButton: {
    color: 'var(--accent)',
    borderColor: 'var(--accent)',
  },
}))
