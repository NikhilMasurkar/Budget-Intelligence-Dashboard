import { makeStyles } from 'tss-react/mui'

// Styles for Figures.jsx. Column layout and amount look come in as parameters.
export const useFiguresUi = makeStyles()((_theme, { cols, color, weight, size } = {}) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: cols,
    gap: '10px',
    alignItems: 'baseline',
  },
  amount: {
    fontSize: size,
    fontWeight: weight,
    color,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  amountEmpty: {
    color: 'var(--line)',
  },
  head: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--line)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  headLeft: {
    textAlign: 'left',
  },
}))
