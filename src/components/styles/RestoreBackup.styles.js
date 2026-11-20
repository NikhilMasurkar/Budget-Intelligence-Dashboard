import { makeStyles } from 'tss-react/mui'

// Styles for RestoreBackup.jsx.
export const useRestoreBackupUi = makeStyles()((theme) => ({
  openButton: {
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    textTransform: 'none',
  },
  hiddenInput: {
    display: 'none',
  },
  confirmBox: {
    width: '100%',
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.75),
    borderRadius: theme.spacing(1),
    border: '1px solid rgb(var(--danger-rgb) / 0.3)',
    background: 'rgb(var(--danger-rgb) / 0.06)',
    textAlign: 'left',
  },
  confirmTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--danger-soft)',
    marginBottom: theme.spacing(0.75),
  },
  confirmText: {
    fontSize: '12px',
    lineHeight: 1.5,
    color: 'var(--text-soft)',
    marginBottom: theme.spacing(0.5),
  },
  confirmActions: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
  restoreButton: {
    flex: 1,
    fontWeight: 700,
    textTransform: 'none',
    background: 'var(--danger)',
    '&:hover': { background: 'var(--danger-strong)' },
  },
  cancelButton: {
    flex: 1,
    textTransform: 'none',
    color: 'var(--text2)',
    borderColor: 'rgb(var(--ink-rgb) / 0.15)',
  },
}))
