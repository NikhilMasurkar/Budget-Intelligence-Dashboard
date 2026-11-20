import { makeStyles } from 'tss-react/mui'

// Styles for InvestmentsSection.jsx.
export const useInvestmentsSectionUi = makeStyles()(() => ({
  card: {
    background: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '18px',
    overflowX: 'auto',
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: 11,
    color: 'var(--text-faint)',
    marginBottom: '10px',
  },
  head: {
    paddingBottom: '8px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)',
  },
  row: {
    paddingTop: '9px',
    paddingBottom: '9px',
    borderBottom: '1px solid rgb(var(--ink-rgb) / 0.03)',
  },
  name: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-soft)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  totalRow: {
    paddingTop: '10px',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text)',
  },
}))
