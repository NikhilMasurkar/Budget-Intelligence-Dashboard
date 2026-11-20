import { Box, Typography } from '@mui/material'
import { fmt } from '../../utils/constants'
import { useFiguresUi } from './styles/Figures.styles'

// Table pieces shared by the Balance Sheet and the Dashboard's Investments card.

export function Grid({ cols, className, children }) {
  const { classes, cx } = useFiguresUi({ cols })
  return <Box className={cx(classes.grid, className)}>{children}</Box>
}

// A rupee figure; with `dim`, zero shows as a faint dash.
export function Amount({ v, color = 'var(--text-soft)', weight = 600, size = 13, dim }) {
  const { classes, cx } = useFiguresUi({ color, weight, size })
  const empty = v === 0 && dim
  return (
    <Typography className={cx(classes.amount, empty && classes.amountEmpty)}>
      {empty ? '—' : `${v < 0 ? '−' : ''}${fmt(Math.abs(v))}`}
    </Typography>
  )
}

export function Head({ children, align = 'right' }) {
  const { classes, cx } = useFiguresUi()
  return <Typography className={cx(classes.head, align === 'left' && classes.headLeft)}>{children}</Typography>
}
