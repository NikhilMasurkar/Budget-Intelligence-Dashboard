import { makeStyles } from 'tss-react/mui'

// Styles for PinReset.jsx.
export const usePinResetUi = makeStyles()(() => ({
  sendIntro: {
    marginBottom: '24px',
  },
  sendError: {
    fontSize: 12,
    color: 'var(--danger)',
    marginBottom: '12px',
    textAlign: 'center',
  },
  sendSpinnerBox: {
    padding: '12px 0',
  },
  sendSpinner: {
    color: 'var(--accent)',
  },
  codeSubtitle: {
    marginBottom: '8px',
  },
  codeEmail: {
    fontSize: 12,
    color: 'var(--accent)',
    marginBottom: '20px',
  },
  codeFooter: {
    marginTop: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    fontSize: 12,
  },
}))
