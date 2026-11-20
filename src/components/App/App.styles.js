import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  headerRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    marginTop: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  titleText: {
    fontWeight: 800,
    fontSize: '18px',
    color: 'var(--text)',
    marginRight: '4px'
  },
  yearTabsContainer: {
    display: 'flex',
    gap: '6px',
    backgroundColor: 'var(--surface2)', // var(--surface2)
    border: '1px solid rgb(var(--ink-rgb) / 0.08)', // var(--border)
    borderRadius: '24px',
    padding: '3px'
  },
  yearTabButton: {
    paddingLeft: '14px',
    paddingRight: '14px',
    paddingTop: '4px',
    paddingBottom: '4px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.18s',
    minWidth: 'auto',
    textTransform: 'none',
    color: 'var(--text2)',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgb(var(--ink-rgb) / 0.04)'
    }
  },
  yearTabActiveButton: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    boxShadow: '0 2px 8px rgb(var(--accent-rgb) / 0.35)',
    '&:hover': {
      backgroundColor: 'var(--accent-strong)'
    }
  },
  flexFiller: {
    flex: 1
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  lockedBanner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgb(var(--warn-rgb) / 0.06)',
    border: '1px solid rgb(var(--warn-rgb) / 0.18)',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '16px',
    color: 'var(--warn)',
    width: '100%',
    boxSizing: 'border-box'
  },
  bannerIcon: {
    marginRight: '8px',
    fontSize: '16px'
  },
  bannerText: {
    fontWeight: 500
  },
  loadingText: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text2)'
  },
  // react-hot-toast sets its colours inline, so these must win over that.
  toast: {
    background: 'var(--bg) !important',
    color: 'var(--text) !important',
    border: '1px solid rgb(var(--ink-rgb) / 0.13)'
  },
  txnTabs: {
    display: 'flex',
    gap: '3px',
    background: 'rgb(var(--ink-rgb) / 0.04)',
    borderRadius: '10px',
    padding: '3px',
    marginBottom: '16px',
    width: 'fit-content'
  },
  txnTab: {
    borderRadius: '8px',
    padding: '5px 14px',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'none',
    minWidth: 0,
    color: 'var(--text-muted)',
    background: 'transparent',
    '&:hover': {
      background: 'rgb(var(--ink-rgb) / 0.05)'
    }
  },
  txnTabActive: {
    color: '#fff',
    background: 'var(--accent)',
    '&:hover': {
      background: 'var(--accent)'
    }
  }
}))
