import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    marginBottom: '16px',
    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: 'repeat(2, 1fr)'
    }
  },
  chartCard: {
    backgroundColor: '#101218',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    [theme.breakpoints.up('sm')]: {
      padding: '20px'
    }
  },
  stackedCard: {
    backgroundColor: '#101218',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    [theme.breakpoints.up('sm')]: {
      padding: '20px'
    }
  },
  chartTitle: {
    fontWeight: 800,
    fontSize: '16px',
    color: '#e4e8f5',
    marginBottom: '4px'
  },
  chartSubtitle: {
    fontSize: '12px',
    color: '#8891b8',
    marginBottom: '18px'
  },
  chartContainer260: {
    height: '260px',
    position: 'relative'
  },
  chartContainer300: {
    height: '300px'
  },
  chartContainer220: {
    height: '220px'
  },
  captionRight: {
    display: 'block',
    fontSize: '11px',
    color: '#6c7293',
    marginTop: '8px',
    textAlign: 'right'
  }
}))
