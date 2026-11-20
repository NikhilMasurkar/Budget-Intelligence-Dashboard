import { makeStyles } from 'tss-react/mui'

// Styles for InvestmentsSection.jsx.
export const useInvestmentsSectionUi = makeStyles()(() => ({
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
    marginBottom: '2px',
  },
  typography2: {
    fontSize: 11,
    color: 'var(--text-faint)',
    marginBottom: '10px',
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
  typography3: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  grid3: {
    paddingTop: '10px',
  },
  typography4: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text)',
  },
}))
