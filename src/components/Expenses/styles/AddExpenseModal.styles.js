import { makeStyles } from 'tss-react/mui'

// Styles for AddExpenseModal.jsx.
export const useAddExpenseModalUi = makeStyles()((theme) => ({
  headerIcon: {
    fontSize: 28,
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
  categoryLabel: {
    color: theme.palette.text.secondary,
  },
  itemLabel: {
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
    background: 'rgb(var(--accent-rgb) / 0.08)',
    border: '1px solid rgb(var(--accent-rgb) / 0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  sumPreviewText: {
    fontSize: 12,
    color: 'var(--accent-soft)',
    fontVariantNumeric: 'tabular-nums',
  },
  amountError: {
    width: '100%',
    marginTop: '-4px',
    fontSize: 11.5,
    color: 'var(--danger-soft)',
  },
  fixedHint: {
    fontSize: 11,
    color: 'var(--text2)',
    marginTop: '2px',
  },
  fixedSwitch: {
    "& .MuiSwitch-switchBase.Mui-checked": {
      color: 'var(--accent)',
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: 'var(--accent)',
    },
  },
  moreOptions: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  moreOptionsToggle: {
    alignSelf: 'flex-start',
    textTransform: 'none',
    color: 'var(--text2)',
    fontSize: 12,
    paddingLeft: '4px',
    paddingRight: '4px',
    minWidth: 0,
  },
  applyToLabel: {
    marginTop: '6px',
  },
  fixedBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s',
    background: 'rgb(var(--ink-rgb) / 0.03)', border: '1px solid rgb(var(--ink-rgb) / 0.07)',
  },
  fixedBoxOn: { background: 'rgb(var(--accent-rgb) / 0.08)', borderColor: 'rgb(var(--accent-rgb) / 0.3)' },
  fixedLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  fixedLabelOn: { color: 'var(--accent-soft)' },
  saveOverdrawn: {
    background: 'var(--danger) !important',
    '&:hover': { background: 'var(--danger-strong) !important' },
  },
}))
