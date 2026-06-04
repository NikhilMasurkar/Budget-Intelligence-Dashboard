import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    marginBottom: '24px',
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '14px'
    }
  },
  cardBase: {
    borderRadius: '12px',
    padding: '16px',
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.up('sm')]: {
      padding: '20px'
    }
  },
  cardInvestments: {
    background: 'linear-gradient(135deg, #1a1f3a, #0f1629)',
    border: '1px solid rgba(91, 127, 255, 0.3)'
  },
  cardWealth: {
    background: 'linear-gradient(135deg, #1f1a0f, #2a200a)',
    border: '1px solid rgba(255, 179, 71, 0.35)'
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px'
  },
  accentInvestments: {
    background: 'linear-gradient(90deg, #5b7fff, #a78bfa)'
  },
  accentWealth: {
    background: 'linear-gradient(90deg, #ffb347, #ffd700)'
  },
  label: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#8891b8',
    marginBottom: '8px',
    fontWeight: 700,
    display: 'block'
  },
  value: {
    fontSize: '26px',
    fontWeight: 900,
    marginBottom: '4px',
    fontVariantNumeric: 'tabular-nums',
    [theme.breakpoints.up('sm')]: {
      fontSize: '28px'
    }
  },
  valueInvestments: {
    color: '#a78bfa'
  },
  valueWealth: {
    color: '#ffd700'
  },
  subText: {
    fontSize: '12px'
  },
  subTextInvestments: {
    color: '#6c76a8'
  },
  subTextWealth: {
    color: '#8a7a3a'
  },
  breakdownSection: {
    marginTop: '10px',
    fontSize: '11px',
    color: '#8891b8',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '10px'
  },
  breakdownHeader: {
    color: '#8891b8'
  },
  breakdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  breakdownBullet: {
    color: '#6c76a8',
    textTransform: 'lowercase'
  },
  breakdownAmount: {
    color: '#a78bfa',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums'
  },
  footerSection: {
    marginTop: '10px',
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '10px'
  },
  footerLabel: {
    fontSize: '11px',
    color: '#8891b8',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    marginTop: '10px',
    paddingTop: '10px'
  }
}))
