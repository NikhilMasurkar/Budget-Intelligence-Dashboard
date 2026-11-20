import { makeStyles } from 'tss-react/mui'

// Styles for PinReset.jsx.
export const usePinResetUi = makeStyles()(() => ({
  typography1: {
    marginBottom: '24px',
  },
  typography2: {
    fontSize: 12,
    color: 'var(--danger)',
    marginBottom: '12px',
    textAlign: 'center',
  },
  box1: {
    padding: '12px 0',
  },
  circularProgress1: {
    color: 'var(--accent)',
  },
  typography3: {
    marginBottom: '8px',
  },
  typography4: {
    fontSize: 12,
    color: 'var(--accent)',
    marginBottom: '20px',
  },
  box2: {
    marginTop: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button1: {
    fontSize: 12,
  },
}))
