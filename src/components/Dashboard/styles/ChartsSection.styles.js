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
    backgroundColor: 'var(--bg)',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
    borderRadius: '12px',
    padding: '16px',
    [theme.breakpoints.up('sm')]: {
      padding: '20px'
    }
  },
  stackedCard: {
    backgroundColor: 'var(--bg)',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
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
    color: 'var(--text)',
    marginBottom: '4px'
  },
  chartSubtitle: {
    fontSize: '12px',
    color: 'var(--text2)',
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
    color: 'var(--text-muted)',
    marginTop: '8px',
    textAlign: 'right'
  }
}))
