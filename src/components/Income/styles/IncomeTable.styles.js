import { makeStyles } from 'tss-react/mui'

// Styles for IncomeTable.jsx.
export const useIncomeTableUi = makeStyles()((theme) => ({
  box1: {
    width: '100%',
  },
  box2: {
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
  trendingUpIcon1: {
    fontSize: 18,
    color: 'var(--accent2)',
  },
  typography1: {
    fontSize: 13,
    color: 'var(--text2)',
  },
  box3: {
    color: 'var(--accent2)',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  box4: {
    textAlign: 'center',
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
    color: 'var(--text-faint)',
    fontSize: 13,
    fontStyle: 'italic',
    border: '1px dashed rgb(var(--ink-rgb) / 0.08)',
    borderRadius: '12px',
  },
  box5: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  box6: {
    flex: 1,
    minWidth: 0,
  },
  typography2: {
    fontWeight: 600,
    fontSize: '13.5px',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  typography3: {
    fontSize: '11px',
    color: 'var(--text-faint)',
    marginTop: '1px',
    fontVariantNumeric: 'tabular-nums',
  },
  typography4: {
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--accent2)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  iconButton1: {
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
  editOutlinedIcon1: {
    fontSize: 18,
    [theme.breakpoints.up('sm')]: {
      fontSize: 15,
    },
  },
  iconButton2: {
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
  deleteOutlinedIcon1: {
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
