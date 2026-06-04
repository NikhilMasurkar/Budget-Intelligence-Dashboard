import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '18px',
    '& > *:last-child:nth-of-type(odd)': {
      gridColumn: 'span 2',
      [theme.breakpoints.up('sm')]: {
        gridColumn: 'auto'
      }
    },
    [theme.breakpoints.up('sm')]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '14px'
    }
  },
  card: {
    backgroundColor: '#101218',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px',
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.up('sm')]: {
      padding: '18px'
    }
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px'
  },
  label: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: '#8891b8',
    marginBottom: '10px',
    fontWeight: 600,
    display: 'block'
  },
  value: {
    fontSize: '20px',
    fontWeight: 800,
    marginBottom: '4px',
    fontVariantNumeric: 'tabular-nums',
    [theme.breakpoints.up('sm')]: {
      fontSize: '22px'
    }
  },
  subText: {
    fontSize: '12px',
    color: '#8891b8'
  }
}))
