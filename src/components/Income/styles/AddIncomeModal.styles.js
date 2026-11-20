import { makeStyles } from 'tss-react/mui'

// Styles for AddIncomeModal.jsx.
export const useAddIncomeModalUi = makeStyles()((theme) => ({
  headerIcon: {
    fontSize: 28,
    color: 'var(--income)',
  },
  halfField: {
    flex: 1,
  },
  yearLabel: {
    color: theme.palette.text.secondary,
  },
  monthLabel: {
    color: theme.palette.text.secondary,
  },
  sourceLabel: {
    color: theme.palette.text.secondary,
  },
  rupeeAdornment: {
    "& .MuiTypography-root": {
      color: theme.palette.text.secondary,
      fontWeight: 600,
      fontSize: 13,
    },
  },
  sumPreview: {
    width: '100%',
    marginTop: '-4px',
    background: 'rgb(var(--income-rgb) / 0.10)',
    border: '1px solid rgb(var(--income-rgb) / 0.35)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  sumPreviewText: {
    fontSize: 12,
    color: 'var(--income-soft)',
    fontVariantNumeric: 'tabular-nums',
  },
  amountError: {
    width: '100%',
    marginTop: '-4px',
    fontSize: 11.5,
    color: 'var(--danger-soft)',
  },
  applyGroup: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
}))
