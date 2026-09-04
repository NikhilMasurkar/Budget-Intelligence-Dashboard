import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { fmt } from '../../utils/constants'
import { investmentCategoryIds } from '../../utils/money'
import { computeYearlySummary, computeHoldingsMatrix, computePosition } from '../../utils/periodStats'

// ── Balance Sheet ────────────────────────────────────────────────────────────
// The Dashboard answers "what happened in the year I'm looking at". This answers
// "where do I stand across every year". Keeping them on separate tabs is what
// stops a running balance and a single-period figure appearing side by side and
// looking like they should reconcile.
//
// Every figure is a sum of rows that were entered. Nothing is projected.
export default function BalanceSheet({ allExpenses = [], allIncome = [], categories = [] }) {
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

  const held      = rows.filter(r => r.balance > 0)
  const withdrawn = rows.filter(r => r.balance < 0)
  const heldTotal = held.reduce((s, r) => s + r.balance, 0)

  const Card = ({ title, subtitle, children }) => (
    <Box sx={{
      background: '#14172a', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', padding: '18px 20px', mb: '18px', overflowX: 'auto',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#e4e8f5' }}>{title}</Typography>
      {subtitle && (
        <Typography sx={{ fontSize: 11, color: '#5a6080', mt: '2px', mb: '10px' }}>{subtitle}</Typography>
      )}
      {children}
    </Box>
  )

  const Amount = ({ v, color = '#c8cfea', weight = 600, size = 13, dim }) => (
    <Typography sx={{
      fontSize: size, fontWeight: weight,
      color: v === 0 && dim ? '#2e3350' : color,
      fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap',
    }}>
      {v === 0 && dim ? '—' : `${v < 0 ? '−' : ''}${fmt(Math.abs(v))}`}
    </Typography>
  )

  const Head = ({ children, align = 'right' }) => (
    <Typography sx={{
      fontSize: 10, fontWeight: 700, color: '#2e3350',
      letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: align,
    }}>
      {children}
    </Typography>
  )

  if (!yearly.length) {
    return (
      <Typography align="center" sx={{ p: 5, color: '#5a6080', fontSize: 13 }}>
        Nothing recorded yet — add some income and expenses first.
      </Typography>
    )
  }

  // rows = item name + one column per year + balance
  const holdingCols = `minmax(120px, 1.6fr) repeat(${years.length + 1}, minmax(88px, 1fr))`
  const yearCols    = 'minmax(70px, 0.8fr) repeat(4, minmax(88px, 1fr))'

  const Grid = ({ cols, children, sx }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: cols, gap: '10px', alignItems: 'baseline', ...sx }}>
      {children}
    </Box>
  )

  const Rule = () => <Box sx={{ height: '1px', background: 'rgba(255,255,255,0.08)', my: '8px' }} />

  return (
    <Box sx={{ pb: 3 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#e4e8f5', mb: '4px' }}>
        Balance Sheet
      </Typography>
      <Typography sx={{ fontSize: 12, color: '#6a7190', mb: '18px' }}>
        Every year together — what you built and where it stands today
      </Typography>

      <Card
        title="Where you stand"
        subtitle="Counts only what you have recorded here — not money you held before you started"
      >
        <Grid cols={yearCols}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#c8cfea' }}>Cash in hand</Typography>
          <Box /><Box /><Box />
          <Amount v={cashInHand} color={cashInHand < 0 ? '#ff5f5f' : '#5b7fff'} weight={700} size={15} />
        </Grid>
        <Grid cols={yearCols}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#c8cfea' }}>In investments</Typography>
          <Box /><Box /><Box />
          <Amount v={netInvested} color="#b97fff" weight={700} size={15} />
        </Grid>
        <Rule />
        <Grid cols={yearCols}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#e4e8f5' }}>Total kept</Typography>
          <Box /><Box /><Box />
          <Amount v={allKept} color={allKept < 0 ? '#ff5f5f' : '#3de8a0'} weight={800} size={19} />
        </Grid>
      </Card>

      {rows.length > 0 && (
        <Card
          title="Investments"
          subtitle="What you put in each year, and what is still in there"
        >
          <Grid cols={holdingCols} sx={{ pb: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Head align="left">Investment</Head>
            {years.map(y => <Head key={y}>{y}</Head>)}
            <Head>Balance</Head>
          </Grid>

          {held.map(h => (
            <Grid key={h.name} cols={holdingCols} sx={{ py: '9px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <Typography sx={{ fontSize: 13, color: '#c8cfea', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {h.name}
              </Typography>
              {years.map(y => <Amount key={y} v={h.byYear[y] || 0} color="#8891b8" weight={500} dim />)}
              <Amount v={h.balance} color="#b97fff" weight={700} />
            </Grid>
          ))}

          {held.length > 0 && (
            <>
              <Rule />
              <Grid cols={holdingCols}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#c8cfea' }}>Still invested</Typography>
                {years.map(y => (
                  <Amount key={y} v={held.reduce((s, h) => s + (h.byYear[y] || 0), 0)} color="#8891b8" dim />
                ))}
                <Amount v={heldTotal} color="#b97fff" weight={800} size={14} />
              </Grid>
            </>
          )}

          {withdrawn.length > 0 && (
            <>
              <Rule />
              {withdrawn.map(h => (
                <Grid key={h.name} cols={holdingCols} sx={{ py: '9px' }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, color: '#c8cfea', fontWeight: 600 }}>{h.name}</Typography>
                    <Typography sx={{ fontSize: 10.5, color: '#5a6080' }}>
                      taken out — not linked to an investment
                    </Typography>
                  </Box>
                  {years.map(y => <Amount key={y} v={h.byYear[y] || 0} color="#ffb347" weight={500} dim />)}
                  <Amount v={h.balance} color="#ffb347" weight={700} />
                </Grid>
              ))}
            </>
          )}

          <Rule />
          <Grid cols={holdingCols}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#e4e8f5' }}>Total</Typography>
            {years.map(y => <Amount key={y} v={totals.byYear[y] || 0} color="#8891b8" dim />)}
            <Amount v={totals.balance} color="#b97fff" weight={800} size={17} />
          </Grid>
        </Card>
      )}

      <Card title="Year by year" subtitle="Investing is money moved between your own pockets, so it is never counted as spending">
        <Grid cols={yearCols} sx={{ pb: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Head align="left">Year</Head>
          <Head>Earned</Head>
          <Head>Spent</Head>
          <Head>Invested</Head>
          <Head>Cash left</Head>
        </Grid>

        {yearly.map(r => (
          <Grid key={r.year} cols={yearCols} sx={{ py: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#c8cfea' }}>{r.year}</Typography>
            <Amount v={r.earned}   color="#3de8a0" />
            <Amount v={r.spent}    color="#ff5f5f" />
            <Amount v={r.invested} color="#b97fff" />
            <Amount v={r.kept - r.invested}
                    color={(r.kept - r.invested) < 0 ? '#ff5f5f' : '#5b7fff'} weight={700} />
          </Grid>
        ))}

        <Rule />
        <Grid cols={yearCols}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#e4e8f5' }}>All years</Typography>
          <Amount v={yearly.reduce((s, r) => s + r.earned, 0)}   color="#3de8a0" weight={800} size={14} />
          <Amount v={yearly.reduce((s, r) => s + r.spent, 0)}    color="#ff5f5f" weight={800} size={14} />
          <Amount v={yearly.reduce((s, r) => s + r.invested, 0)} color="#b97fff" weight={800} size={14} />
          <Amount v={cashInHand} color={cashInHand < 0 ? '#ff5f5f' : '#5b7fff'} weight={800} size={14} />
        </Grid>
      </Card>
    </Box>
  )
}
