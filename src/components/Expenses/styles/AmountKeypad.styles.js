import { makeStyles } from 'tss-react/mui'

// Styles for AmountKeypad.jsx.
export const useAmountKeypadUi = makeStyles()(() => ({
  resultBar: {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
    borderRadius: '12px',
    padding: '10px',
    marginTop: '-4px',
  },
  resultText: {
    fontSize: 12,
    color: 'var(--accent-soft)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingBottom: '8px',
  },
  keys: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '7px',
  },
  backspaceIcon: {
    fontSize: 19,
  },
  key: {
    minWidth: 0, height: 44, borderRadius: '10px', fontSize: 17, fontWeight: 700,
    textTransform: 'none', lineHeight: 1, color: 'var(--text)',
    background: 'rgb(var(--ink-rgb) / 0.05)', border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.09)' },
  },
  keyWide: { gridColumn: 'span 2' },
  keyOp: {
    color: 'var(--accent-soft)', background: 'rgb(var(--accent-rgb) / 0.10)',
    '&:hover': { background: 'rgb(var(--accent-rgb) / 0.18)' },
  },
  keyGo: {
    color: 'var(--bg)', background: 'var(--accent)',
    '&:hover': { background: 'var(--accent-strong)' },
  },
}))
