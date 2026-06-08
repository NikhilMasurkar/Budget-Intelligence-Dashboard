import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
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
    color: '#e4e8f5',
    marginRight: '4px'
  },
  yearTabsContainer: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#181b28', // var(--surface2)
    border: '1px solid rgba(255, 255, 255, 0.08)', // var(--border)
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
    color: '#8891b8',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)'
    }
  },
  yearTabActiveButton: {
    backgroundColor: '#5b7fff',
    color: 'white',
    boxShadow: '0 2px 8px rgba(91, 127, 255, 0.35)',
    '&:hover': {
      backgroundColor: '#4a6eee'
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
    backgroundColor: 'rgba(255, 179, 71, 0.06)',
    border: '1px solid rgba(255, 179, 71, 0.18)',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '16px',
    color: '#ffb347',
    width: '100%',
    boxSizing: 'border-box'
  }
}))
