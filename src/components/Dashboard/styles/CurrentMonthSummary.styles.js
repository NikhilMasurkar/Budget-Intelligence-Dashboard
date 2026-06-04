import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  container: {
    backgroundColor: '#181b28',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    [theme.breakpoints.up('sm')]: {
      padding: '18px'
    }
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px'
  },
  headerText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#8891b8',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '14px',
    [theme.breakpoints.up('sm')]: {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  card: {
    backgroundColor: '#101218',
    borderRadius: '8px',
    padding: '14px',
    position: 'relative'
  },
  cardIncome: {
    borderLeft: '3px solid #5b7fff'
  },
  cardExpenses: {
    borderLeft: '3px solid #ff5f5f'
  },
  cardLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#8891b8',
    fontWeight: 700,
    letterSpacing: '0.5px'
  },
  cardValue: {
    fontSize: '18px',
    fontWeight: 800,
    marginTop: '4px'
  },
  valueIncome: {
    color: '#5b7fff'
  },
  valueExpenses: {
    color: '#ff5f5f'
  }
}))
