import { Box, Typography } from '@mui/material'
import { useInvestmentsSectionUi } from '../styles/InvestmentsSection.styles'
import { Grid, Amount, Head } from '../../BalanceSheet/Figures'

const COLS = 'minmax(110px, 1.6fr) minmax(92px, 1fr) minmax(92px, 1fr)'

export default function InvestmentsSection({ holdings, periodTotal, periodLabel }) {
  const { classes: ui } = useInvestmentsSectionUi()
  if (!holdings.length) return null

  const balanceTotal = holdings.reduce((s, h) => s + h.balance, 0)

  return (
    <Box className={ui.box1}>
      <Typography className={ui.typography1}>
        Investments
      </Typography>
      <Typography className={ui.typography2}>
        Balance includes earlier years — a pot can go down this period and still hold money
      </Typography>

      <Grid cols={COLS} className={ui.grid1}>
        <Head align="left">Investment</Head>
        <Head>{periodLabel || 'This period'}</Head>
        <Head>Balance</Head>
      </Grid>

      {holdings.map(h => (
        <Grid cols={COLS} className={ui.grid2} key={h.name}>
          <Typography className={ui.typography3}>
            {h.name}
          </Typography>
          <Amount
            v={h.period}
            color={h.period > 0 ? 'var(--accent2)' : h.period < 0 ? 'var(--warn)' : 'var(--line)'}
            weight={600}
            size={13}
            dim
          />
          <Amount v={h.balance} color={h.balance < 0 ? 'var(--danger)' : 'var(--purple)'} weight={700} size={14} />
        </Grid>
      ))}

      <Grid cols={COLS} className={ui.grid3}>
        <Typography className={ui.typography4}>Total</Typography>
        <Amount
          v={periodTotal}
          color={periodTotal > 0 ? 'var(--accent2)' : periodTotal < 0 ? 'var(--warn)' : 'var(--line)'}
          weight={800}
          size={14}
          dim
        />
        <Amount v={balanceTotal} color="var(--purple)" weight={800} size={17} />
      </Grid>
    </Box>
  )
}
