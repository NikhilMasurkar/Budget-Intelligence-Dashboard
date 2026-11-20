import { makeStyles } from 'tss-react/mui'

// Styles for AddIncomeModal.jsx.
export const useAddIncomeModalUi = makeStyles()((theme) => ({
  trendingUpIcon1: {
    fontSize: 28,
    color: 'var(--income)',
  },
  formControl1: {
    flex: 1,
  },
  inputLabel1: {
    color: theme.palette.text.secondary,
  },
  formControl2: {
    flex: 1,
  },
  inputLabel2: {
    color: theme.palette.text.secondary,
  },
  inputLabel3: {
    color: theme.palette.text.secondary,
  },
  inputAdornment1: {
    "& .MuiTypography-root": {
      color: theme.palette.text.secondary,
      fontWeight: 600,
      fontSize: 13,
    },
  },
  box1: {
    width: '100%',
    marginTop: '-4px',
    background: 'rgb(var(--income-rgb) / 0.10)',
    border: '1px solid rgb(var(--income-rgb) / 0.35)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  typography1: {
    fontSize: 12,
    color: 'var(--income-soft)',
    fontVariantNumeric: 'tabular-nums',
  },
  typography2: {
    width: '100%',
    marginTop: '-4px',
    fontSize: 11.5,
    color: 'var(--danger-soft)',
  },
  box2: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
}))
