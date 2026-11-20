import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { investmentCategoryIds } from '../../utils/money'
import { computeYearlySummary, computeHoldingsMatrix, computePosition } from '../../utils/periodStats'
import { useBalanceSheetUi } from './styles/BalanceSheet.styles'
import { Grid, Amount, Head } from './Figures'

// ── Balance Sheet ────────────────────────────────────────────────────────────
// The Dashboard answers "what happened in the year I'm looking at". This answers
// "where do I stand across every year". Keeping them on separate tabs is what
// stops a running balance and a single-period figure appearing side by side and
// looking like they should reconcile.
//
// Every figure is a sum of rows that were entered. Nothing is projected.
// Label + amount: no year columns here, so it fits a phone without scrolling.
const STAND_COLS = 'minmax(0, 1fr) auto'

export default function BalanceSheet({ allExpenses = [], allIncome = [], categories = [] }) {
  const { classes: ui } = useBalanceSheetUi()
  const investCatIds = useMemo(() => investmentCategoryIds(categories), [categories])

  const yearly = useMemo(
    () => computeYearlySummary({ allIncome, allExpenses, investCatIds }),
    [allIncome, allExpenses, investCatIds]
  )
  const { years, rows, totals } = useMemo(
    () => computeHoldingsMatrix({ allExpenses, investCatIds }),
    [allExpenses, investCatIds]
  )

  const { kept: allKept, invested: netInvested, cash: cashInHand } = useMemo(
    () => computePosition({ allIncome, allExpenses, investCatIds }),
    [allIncome, allExpenses, investCatIds]
  )

  // >= 0 so a closed pot (funded then fully withdrawn) still shows, with a zero
  // balance. It carries real year history, and dropping it would leave the
  // displayed rows not adding up to the totals underneath them.
  const held      = rows.filter(r => r.balance >= 0)
  const withdrawn = rows.filter(r => r.balance < 0)
  const heldTotal = held.reduce((s, r) => s + r.balance, 0)

  const Card = ({ title, subtitle, children }) => (
    <Box className={ui.box1}>
      <Typography className={ui.typography1}>{title}</Typography>
      {subtitle && (
        <Typography className={ui.typography2}>{subtitle}</Typography>
      )}
      {children}
    </Box>
  )

  if (!yearly.length) {
    return (
      <Typography className={ui.typography3} align="center">
        Nothing recorded yet — add some income and expenses first.
      </Typography>
    )
  }

  // rows = item name + one column per year + balance
  const holdingCols = `minmax(120px, 1.6fr) repeat(${years.length + 1}, minmax(88px, 1fr))`
  const yearCols    = 'minmax(70px, 0.8fr) repeat(4, minmax(88px, 1fr))'

  const Rule = () => <Box className={ui.box2} />

  return (
    <Box className={ui.box3}>
      <Typography className={ui.typography4}>
        Balance Sheet
      </Typography>
      <Typography className={ui.typography5}>
        Every year together — what you built and where it stands today
      </Typography>

      <Card
        title="Where you stand"
        subtitle="Counts only what you have recorded here — not money you held before you started"
      >
        <Grid cols={STAND_COLS}>
          <Typography className={ui.typography6}>Cash in hand</Typography>
          <Amount v={cashInHand} color={cashInHand < 0 ? 'var(--danger)' : 'var(--accent)'} weight={700} size={15} />
        </Grid>
        <Grid cols={STAND_COLS}>
          <Typography className={ui.typography7}>In investments</Typography>
          <Amount v={netInvested} color="var(--purple)" weight={700} size={15} />
        </Grid>
        <Rule />
        <Grid cols={STAND_COLS}>
          <Typography className={ui.typography8}>Total kept</Typography>
          <Amount v={allKept} color={allKept < 0 ? 'var(--danger)' : 'var(--accent2)'} weight={800} size={19} />
        </Grid>
      </Card>

      {rows.length > 0 && (
        <Card
          title="Investments"
          subtitle="What you put in each year, and what is still in there"
        >
          <Grid className={ui.grid1} cols={holdingCols}>
            <Head align="left">Investment</Head>
            {years.map(y => <Head key={y}>{y}</Head>)}
            <Head>Balance</Head>
          </Grid>

          {held.map(h => (
            <Grid className={ui.grid2} key={h.name} cols={holdingCols}>
              <Typography className={ui.typography9}>
                {h.name}
              </Typography>
              {years.map(y => <Amount key={y} v={h.byYear[y] || 0} color="var(--text2)" weight={500} dim />)}
              <Amount v={h.balance} color="var(--purple)" weight={700} />
            </Grid>
          ))}

          {held.length > 0 && (
            <>
              <Rule />
              <Grid cols={holdingCols}>
                <Typography className={ui.typography10}>Still invested</Typography>
                {years.map(y => (
                  <Amount key={y} v={held.reduce((s, h) => s + (h.byYear[y] || 0), 0)} color="var(--text2)" dim />
                ))}
                <Amount v={heldTotal} color="var(--purple)" weight={800} size={14} />
              </Grid>
            </>
          )}

          {withdrawn.length > 0 && (
            <>
              <Rule />
              {withdrawn.map(h => (
                <Grid className={ui.grid3} key={h.name} cols={holdingCols}>
                  <Box>
                    <Typography className={ui.typography11}>{h.name}</Typography>
                    <Typography className={ui.typography12}>
                      taken out — not linked to an investment
                    </Typography>
                  </Box>
                  {years.map(y => <Amount key={y} v={h.byYear[y] || 0} color="var(--warn)" weight={500} dim />)}
                  <Amount v={h.balance} color="var(--warn)" weight={700} />
                </Grid>
              ))}
            </>
          )}

          <Rule />
          <Grid cols={holdingCols}>
            <Typography className={ui.typography13}>Total</Typography>
            {years.map(y => <Amount key={y} v={totals.byYear[y] || 0} color="var(--text2)" dim />)}
            <Amount v={totals.balance} color="var(--purple)" weight={800} size={17} />
          </Grid>
        </Card>
      )}

      <Card title="Year by year" subtitle="Investing is money moved between your own pockets, so it is never counted as spending">
        <Grid className={ui.grid4} cols={yearCols}>
          <Head align="left">Year</Head>
          <Head>Earned</Head>
          <Head>Spent</Head>
          <Head>Invested</Head>
          <Head>Cash left</Head>
        </Grid>

        {yearly.map(r => (
          <Grid className={ui.grid5} key={r.year} cols={yearCols}>
            <Typography className={ui.typography14}>{r.year}</Typography>
            <Amount v={r.earned}   color="var(--accent2)" />
            <Amount v={r.spent}    color="var(--danger)" />
            <Amount v={r.invested} color="var(--purple)" />
            <Amount v={r.kept - r.invested}
                    color={(r.kept - r.invested) < 0 ? 'var(--danger)' : 'var(--accent)'} weight={700} />
          </Grid>
        ))}

        <Rule />
        <Grid cols={yearCols}>
          <Typography className={ui.typography15}>All years</Typography>
          <Amount v={yearly.reduce((s, r) => s + r.earned, 0)}   color="var(--accent2)" weight={800} size={14} />
          <Amount v={yearly.reduce((s, r) => s + r.spent, 0)}    color="var(--danger)" weight={800} size={14} />
          <Amount v={yearly.reduce((s, r) => s + r.invested, 0)} color="var(--purple)" weight={800} size={14} />
          <Amount v={cashInHand} color={cashInHand < 0 ? 'var(--danger)' : 'var(--accent)'} weight={800} size={14} />
        </Grid>
      </Card>
    </Box>
  )
}
