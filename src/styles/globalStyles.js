import { makeStyles } from 'tss-react/mui'

export const useGlobalStyles = makeStyles()((theme) => ({
  globalContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)'
  },
  contentArea: {
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '16px',
    // Room to scroll the last row clear of the floating add button
    paddingBottom: '88px',
    maxWidth: '1800px',
    marginLeft: 'auto',
    marginRight: 'auto',
    [theme.breakpoints.up('sm')]: {
      paddingLeft: '3%',
      paddingRight: '3%'
    },
    // ...and of the phone bottom tab bar (56px) plus the home indicator
    [theme.breakpoints.down('md')]: {
      paddingBottom: 'calc(56px + 88px + env(safe-area-inset-bottom))'
    }
  },
  glassCard: {
    backgroundColor: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    [theme.breakpoints.up('sm')]: {
      padding: '18px'
    }
  },
  nativeSelectFormControl: {
    minWidth: '90px'
  },
  nativeSelect: {
    height: '34px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'var(--surface2)',
    color: 'var(--text)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgb(var(--ink-rgb) / 0.08)'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--accent)'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--accent)'
    },
    '& select': {
      paddingTop: '6px',
      paddingBottom: '6px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: 'var(--surface2)',
      color: 'var(--text)'
    }
  },
  containedBlueButton: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: '8px',
    height: '34px',
    fontSize: '13px',
    paddingLeft: '16px',
    paddingRight: '16px',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: 'var(--accent-strong)',
      boxShadow: 'none'
    }
  }
}))
