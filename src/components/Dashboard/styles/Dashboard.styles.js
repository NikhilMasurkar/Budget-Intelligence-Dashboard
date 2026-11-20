import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  container: {
    animation: 'fadeIn 0.3s ease'
  }
}))

// Moved from inline sx/style in index.jsx.
export const useDashboardUi = makeStyles()((theme) => ({
  periodSummary: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px 16px',
    marginBottom: '16px',
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  periodLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  periodDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  separator: {
    fontSize: 12,
    color: 'var(--line)',
  },
  earned: {
    fontSize: 12,
    color: 'var(--accent2)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  spent: {
    fontSize: 12,
    color: 'var(--danger)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  invested: {
    fontSize: 12,
    color: 'var(--purple)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  summaryDivider: {
    width: '1px',
    height: 12,
    background: 'rgb(var(--ink-rgb) / 0.07)',
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  monthNow: {
    fontSize: 11,
    color: 'var(--line)',
  },
  monthIn: {
    color: 'var(--text2)',
    fontVariantNumeric: 'tabular-nums',
  },
  monthOut: {
    color: 'var(--text2)',
    fontVariantNumeric: 'tabular-nums',
  },
  monthSaved: { color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
  monthShort: { color: 'var(--danger)' },
}))
