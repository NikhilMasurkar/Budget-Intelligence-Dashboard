import { makeStyles } from 'tss-react/mui'

// Styles for IncomeTable.jsx.
export const useIncomeTableUi = makeStyles()((theme) => ({
  page: {
    width: '100%',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    padding: '10px 16px',
    marginBottom: '12px',
    background: 'rgb(var(--income-rgb) / 0.06)',
    border: '1px solid rgb(var(--income-rgb) / 0.2)',
    borderRadius: '10px',
  },
  summaryIcon: {
    fontSize: 18,
    color: 'var(--accent2)',
  },
  summaryText: {
    fontSize: 13,
    color: 'var(--text2)',
  },
  summaryTotal: {
    color: 'var(--accent2)',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  emptyText: {
    textAlign: 'center',
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
    color: 'var(--text-faint)',
    fontSize: 13,
    fontStyle: 'italic',
    border: '1px dashed rgb(var(--ink-rgb) / 0.08)',
    borderRadius: '12px',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  source: {
    fontWeight: 600,
    fontSize: '13.5px',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  date: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    marginTop: '1px',
    fontVariantNumeric: 'tabular-nums',
  },
  amount: {
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--accent2)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  editButton: {
    color: 'var(--text2)',
    padding: '9px',
    "&:hover": {
      color: 'var(--accent)',
      background: 'rgb(var(--accent-rgb) / 0.1)',
    },
    [theme.breakpoints.up('sm')]: {
      padding: '4px',
    },
  },
  editIcon: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 15,
    },
  },
  deleteButton: {
    color: 'var(--text2)',
    padding: '9px',
    "&:hover": {
      color: 'var(--danger)',
      background: 'rgb(var(--danger-rgb) / 0.1)',
    },
    [theme.breakpoints.up('sm')]: {
      padding: '4px',
    },
  },
  deleteIcon: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 15,
    },
  },
  incomeRow: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
    background: 'var(--bg)', borderTop: '1px solid rgb(var(--ink-rgb) / 0.04)',
    transition: 'background 0.12s',
    '&:first-of-type': { borderTop: 'none' },
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.015)' },
  },
}))
