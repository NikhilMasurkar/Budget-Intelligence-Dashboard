import { makeStyles } from 'tss-react/mui'

// Styles for index.jsx.
export const useBalanceSheetUi = makeStyles()((theme) => ({
  box1: {
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '18px',
    overflowX: 'auto',
  },
  typography1: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
  },
  typography2: {
    fontSize: 11,
    color: 'var(--text-faint)',
    marginTop: '2px',
    marginBottom: '10px',
  },
  typography3: {
    padding: theme.spacing(5),
    color: 'var(--text-faint)',
    fontSize: 13,
  },
  box2: {
    height: '1px',
    background: 'rgb(var(--ink-rgb) / 0.08)',
    marginTop: '8px',
    marginBottom: '8px',
  },
  box3: {
    paddingBottom: theme.spacing(3),
  },
  typography4: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  typography5: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: '18px',
  },
  typography6: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
  },
  typography7: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
  },
  typography8: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--text)',
  },
  grid1: {
    paddingBottom: '8px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  grid2: {
    paddingTop: '9px',
    paddingBottom: '9px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)',
  },
  typography9: {
    fontSize: 13,
    color: 'var(--text-soft)',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  typography10: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-soft)',
  },
  grid3: {
    paddingTop: '9px',
    paddingBottom: '9px',
  },
  typography11: {
    fontSize: 13,
    color: 'var(--text-soft)',
    fontWeight: 600,
  },
  typography12: {
    fontSize: 10.5,
    color: 'var(--text-faint)',
  },
  typography13: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--text)',
  },
  grid4: {
    paddingBottom: '8px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  grid5: {
    paddingTop: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)',
  },
  typography14: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-soft)',
  },
  typography15: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text)',
  },
}))
