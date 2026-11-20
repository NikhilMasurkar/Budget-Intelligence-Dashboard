import { makeStyles } from 'tss-react/mui'

// Styles for BudgetProgressSection.jsx.
export const useBudgetProgressSectionUi = makeStyles()((theme) => ({
  section: {
    marginBottom: '18px',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '12px',
  },
  title: {
    color: 'var(--text)',
    fontWeight: 700,
    fontSize: 14,
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: 11,
  },
  table: {
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    paddingRight: '12px',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  shareCell: {
    display: 'none',
    alignItems: 'center',
    gap: '8px',
    paddingRight: '16px',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  shareTrack: {
    flex: 1,
    height: 5,
    borderRadius: theme.shape.borderRadius * 3,
    background: 'rgb(var(--ink-rgb) / 0.05)',
    overflow: 'hidden',
  },
  budgetCell: {
    display: 'none',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  budgetAmount: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--text-muted)',
  },
  setBudget: {
    fontSize: 11,
    color: 'var(--line)',
    cursor: 'pointer',
    "&:hover": {
      color: 'var(--accent)',
    },
  },
  noBudget: {
    fontSize: 11,
    color: 'var(--line)',
  },
  statusCell: {
    textAlign: 'right',
  },
  overText: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--danger)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  overWord: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'inline',
    },
  },
  leftWord: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'inline',
    },
  },
  noStatus: {
    fontSize: 11,
    color: 'var(--line)',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--line)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  totalShareGap: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--accent-soft)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    paddingRight: '12px',
  },
  totalBudgetGap: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 110px',
    alignItems: 'center',
    paddingLeft: '16px',
    paddingRight: '16px',
    [theme.breakpoints.up('md')]: { gridTemplateColumns: '1fr 170px 110px 110px 130px' },
  },
  headRow: { paddingTop: '8px', paddingBottom: '8px', borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)', background: 'rgb(var(--ink-rgb) / 0.02)' },
  colHead: { fontSize: 10, fontWeight: 700, color: 'var(--line)', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'left' },
  colHeadRight: { textAlign: 'right', paddingRight: '12px' },
  colHeadWide: { display: 'none', [theme.breakpoints.up('md')]: { display: 'block' } },
  row: {
    paddingTop: '11px', paddingBottom: '11px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.04)',
    cursor: 'pointer', transition: 'background 0.1s',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.025)' },
  },
  rowLast: { borderBottom: 'none' },
  spent: { fontSize: 13, fontWeight: 800, color: 'var(--text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', paddingRight: '12px' },
  spentNegative: { color: 'var(--danger)' },
  left: { fontSize: 12, fontWeight: 600, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  leftWarn: { color: 'var(--warn)' },
  totalRow: { paddingTop: '10px', paddingBottom: '10px', borderTop: '1px solid rgb(var(--ink-rgb) / 0.06)', background: 'rgb(var(--ink-rgb) / 0.02)' },
}))

// One category's own colour and share-bar width.
export const useCategoryTintUi = makeStyles()((_theme, { color, width = 0 }) => ({
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 5px ${color}60` },
  bar: { height: '100%', width: `${width}%`, background: color, opacity: 0.75, borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: 700, color, minWidth: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
}))
