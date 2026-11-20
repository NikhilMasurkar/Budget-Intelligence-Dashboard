import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  container: {
    animation: 'fadeIn 0.3s ease'
  }
}))

// Moved from inline sx/style in index.jsx.
export const useDashboardUi = makeStyles()((theme) => ({
  box1: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px 16px',
    marginBottom: '16px',
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  box2: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  box3: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
  },
  typography1: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  typography2: {
    fontSize: 12,
    color: 'var(--line)',
  },
  typography3: {
    fontSize: 12,
    color: 'var(--accent2)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  typography4: {
    fontSize: 12,
    color: 'var(--line)',
  },
  typography5: {
    fontSize: 12,
    color: 'var(--danger)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  typography6: {
    fontSize: 12,
    color: 'var(--line)',
  },
  typography7: {
    fontSize: 12,
    color: 'var(--purple)',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  box4: {
    width: '1px',
    height: 12,
    background: 'rgb(var(--ink-rgb) / 0.07)',
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  typography8: {
    fontSize: 11,
    color: 'var(--line)',
  },
  box5: {
    color: 'var(--text2)',
    fontVariantNumeric: 'tabular-nums',
  },
  box6: {
    color: 'var(--text2)',
    fontVariantNumeric: 'tabular-nums',
  },
  monthSaved: { color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
  monthShort: { color: 'var(--danger)' },
}))
