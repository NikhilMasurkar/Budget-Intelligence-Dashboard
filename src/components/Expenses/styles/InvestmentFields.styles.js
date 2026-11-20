import { makeStyles } from 'tss-react/mui'

// Styles for InvestmentFields.jsx.
export const useInvestmentFieldsUi = makeStyles()((theme) => ({
  box1: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  typography1: {
    fontSize: 11,
    color: 'var(--text2)',
    marginTop: '6px',
  },
  inputLabel1: {
    color: theme.palette.text.secondary,
  },
  box2: {
    width: '100%',
    background: 'rgb(var(--ink-rgb) / 0.03)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  typography2: {
    fontSize: 11,
    color: 'var(--text2)',
    marginBottom: '6px',
  },
  box3: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '2px',
    paddingBottom: '2px',
  },
  typography3: {
    fontSize: 12,
    color: 'var(--text-soft)',
  },
  typography4: {
    fontSize: 12,
    color: 'var(--danger)',
    fontVariantNumeric: 'tabular-nums',
  },
  withdrawActive: {
    background: 'var(--danger) !important',
    borderColor: 'var(--danger) !important',
    '&:hover': { background: 'var(--danger-strong) !important' },
  },
}))
