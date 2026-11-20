import { makeStyles } from 'tss-react/mui'

// Styles for InvestmentFields.jsx.
export const useInvestmentFieldsUi = makeStyles()((theme) => ({
  directionField: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  directionHint: {
    fontSize: 11,
    color: 'var(--text2)',
    marginTop: '6px',
  },
  withdrawFromLabel: {
    color: theme.palette.text.secondary,
  },
  partsPreview: {
    width: '100%',
    background: 'rgb(var(--ink-rgb) / 0.03)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  partsTitle: {
    fontSize: 11,
    color: 'var(--text2)',
    marginBottom: '6px',
  },
  partRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '2px',
    paddingBottom: '2px',
  },
  partName: {
    fontSize: 12,
    color: 'var(--text-soft)',
  },
  partAmount: {
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
