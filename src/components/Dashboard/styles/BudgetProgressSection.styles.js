import { makeStyles } from 'tss-react/mui'

// Styles for BudgetProgressSection.jsx.
export const useBudgetProgressSectionUi = makeStyles()((theme) => ({
  box1: {
    marginBottom: '18px',
  },
  box2: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '12px',
  },
  typography1: {
    color: 'var(--text)',
    fontWeight: 700,
    fontSize: 14,
  },
  typography2: {
    color: 'var(--text-muted)',
    fontSize: 11,
  },
  box3: {
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  box4: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    paddingRight: '12px',
  },
  typography3: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  box5: {
    display: 'none',
    alignItems: 'center',
    gap: '8px',
    paddingRight: '16px',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  box6: {
    flex: 1,
    height: 5,
    borderRadius: theme.shape.borderRadius * 3,
    background: 'rgb(var(--ink-rgb) / 0.05)',
    overflow: 'hidden',
  },
  box7: {
    display: 'none',
    justifyContent: 'flex-end',
    paddingRight: '12px',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  typography4: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--text-muted)',
  },
  typography5: {
    fontSize: 11,
    color: 'var(--line)',
    cursor: 'pointer',
    "&:hover": {
      color: 'var(--accent)',
    },
  },
  typography6: {
    fontSize: 11,
    color: 'var(--line)',
  },
  box8: {
    textAlign: 'right',
  },
  typography7: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--danger)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  box9: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'inline',
    },
  },
  box10: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'inline',
    },
  },
  typography8: {
    fontSize: 11,
    color: 'var(--line)',
  },
  typography9: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--line)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  box11: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
  },
  typography10: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--accent-soft)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    paddingRight: '12px',
  },
  box12: {
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
