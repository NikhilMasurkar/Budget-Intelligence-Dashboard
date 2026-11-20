import { makeStyles } from 'tss-react/mui'

// Styles for index.jsx.
export const useBalanceSheetUi = makeStyles()((theme) => ({
  card: {
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '18px',
    overflowX: 'auto',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'var(--text-faint)',
    marginTop: '2px',
    marginBottom: '10px',
  },
  emptyText: {
    padding: theme.spacing(5),
    color: 'var(--text-faint)',
    fontSize: 13,
  },
  rule: {
    height: '1px',
    background: 'rgb(var(--ink-rgb) / 0.08)',
    marginTop: '8px',
    marginBottom: '8px',
  },
  page: {
    paddingBottom: theme.spacing(3),
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: '18px',
  },
  cashLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
  },
  investedLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
  },
  totalKeptLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--text)',
  },
  holdingsHead: {
    paddingBottom: '8px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  holdingRow: {
    paddingTop: '9px',
    paddingBottom: '9px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)',
  },
  holdingName: {
    fontSize: 13,
    color: 'var(--text-soft)',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  stillInvestedLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-soft)',
  },
  withdrawnRow: {
    paddingTop: '9px',
    paddingBottom: '9px',
  },
  withdrawnName: {
    fontSize: 13,
    color: 'var(--text-soft)',
    fontWeight: 600,
  },
  withdrawnNote: {
    fontSize: 10.5,
    color: 'var(--text-faint)',
  },
  holdingsTotalLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--text)',
  },
  yearsHead: {
    paddingBottom: '8px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  yearRow: {
    paddingTop: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)',
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-soft)',
  },
  stack: {
    paddingTop: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
    '&:last-of-type': { borderBottom: 'none' },
  },
  stackTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
    overflowWrap: 'anywhere',
  },
  stackTitleStrong: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--text)',
  },
  stackParts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    columnGap: '18px',
    rowGap: '4px',
    marginTop: '6px',
  },
  stackLabel: {
    fontSize: 11,
    color: 'var(--text-faint)',
  },
  allYearsLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text)',
  },
}))
