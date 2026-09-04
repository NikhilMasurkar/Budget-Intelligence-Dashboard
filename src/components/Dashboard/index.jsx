import React, { useMemo, useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useStyles } from './styles/Dashboard.styles'
import MonthFilterControl from './subcomponents/MonthFilterControl'
import InvestmentsSection from './subcomponents/InvestmentsSection'
import BudgetProgressSection from './subcomponents/BudgetProgressSection'
import ChartsSection from './subcomponents/ChartsSection'
import CategoryDetailsDialog from './subcomponents/CategoryDetailsDialog'
import { MONTHS, fmt, fmtK, defaultMonths, CHART_OPTS } from '../../utils/constants'
import { monthKey, computeHoldingsWithBalance } from '../../utils/periodStats'
import { investmentCategoryIds } from '../../utils/money'

function periodLabel(selMonths, year) {
  const s = [...selMonths].sort((a, b) => a - b)
  if (s.length === 12) return `Full Year ${year}`
  if (s.length === 1)  return `${MONTHS[s[0]]} ${year}`
  if (s.length === 3 && s[0] === 0)  return `Q1 ${year}`
  if (s.length === 3 && s[0] === 3)  return `Q2 ${year}`
  if (s.length === 3 && s[0] === 6)  return `Q3 ${year}`
  if (s.length === 3 && s[0] === 9)  return `Q4 ${year}`
  if (s.length === 6 && s[0] === 0)  return `H1 ${year}`
  if (s.length === 6 && s[0] === 6)  return `H2 ${year}`
  return `${s.map(m => MONTHS[m]).join(', ')} ${year}`
}

export default function Dashboard({ expenses, income, allExpenses = [], categories, year, month, selMonths, setSelMonths, onEditCategory }) {
  const { classes } = useStyles()
  const [detailModal, setDetailModal] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const investCatIds = useMemo(() => investmentCategoryIds(categories), [categories])

  // Build monthly aggregates — split expenses into investing vs spending
  const monthlyData = useMemo(() => {
    const inc  = Array(12).fill(0)
    const exp  = Array(12).fill(0)
    const inv  = Array(12).fill(0)
    const spend= Array(12).fill(0)
    income.forEach(i => {
      const m = +i.month - 1
      if (m >= 0 && m < 12) inc[m] += +i.amount || 0
    })
    expenses.forEach(e => {
      const m = +e.month - 1
      if (m < 0 || m >= 12) return
      const amt = +e.amount || 0
      exp[m] += amt
      if (investCatIds.has(e.categoryId)) inv[m] += amt
      else spend[m] += amt
    })
    return {
      inc, exp, inv, spend,
      // What you actually kept: income minus real spending. Investing is a
      // transfer between your own pockets, so it must not count as spending.
      kept: inc.map((v, i) => v - spend[i]),
    }
  }, [income, expenses, investCatIds])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  // Category totals for the spending chart — investments excluded so the chart
  // answers "where did my spending go" without an INVESTMENTS slice dominating
  // it and contradicting the Spent figure above.
  const catTotals = useMemo(() => {
    const t = {}
    expenses
      .filter(e => selMonths.includes(+e.month - 1) && !investCatIds.has(e.categoryId))
      .forEach(e => {
        const cat = catMap[e.categoryId]?.name || e.categoryId || 'Other'
        t[cat] = (t[cat] || 0) + (+e.amount || 0)
      })
    return Object.entries(t).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])
  }, [expenses, catMap, selMonths, investCatIds])

  // Selected period totals.
  //   Earned − Spent = Kept,  and  Kept = Invested + Cash left
  // selSpend excludes investment categories — money moved into an investment is
  // still yours, so calling it "spent" was the core confusion in this dashboard.
  const selIncome    = selMonths.reduce((s,i) => s + monthlyData.inc[i], 0)
  const selSpend     = selMonths.reduce((s,i) => s + monthlyData.spend[i], 0)
  const selInvest    = selMonths.reduce((s,i) => s + monthlyData.inv[i], 0)

  const selStartKey = selMonths.length ? monthKey(year, Math.min(...selMonths) + 1) : null
  const selEndKey   = selMonths.length ? monthKey(year, Math.max(...selMonths) + 1) : null

  // Both figures per pot: what moved this period, and the balance carrying
  // forward from earlier years. Needs the full history, not just this year —
  // a withdrawal can exceed this year's deposits, which reads as a negative
  // pot until you can see the balance beside it.
  const holdings = useMemo(
    () => computeHoldingsWithBalance({ allExpenses, investCatIds, fromKey: selStartKey, toKey: selEndKey }),
    [allExpenses, investCatIds, selStartKey, selEndKey]
  )

  const filteredLabels = selMonths.map(i => MONTHS[i])
  const catColors = ['#5b7fff','#3de8a0','#ff5f5f','#b97fff','#ffb347','#ff6eb4','#60c0ff','#ffd700','#ff8c69','#7fffd4']

  const curYear = new Date().getFullYear()
  const displayMonth = (year === curYear) ? (new Date().getMonth() + 1) : month
  const displayMonthName = MONTHS[displayMonth - 1]

  const curMonthInc = income.filter(i => String(i.month) === String(displayMonth)).reduce((s, i) => s + (+i.amount || 0), 0)
  const curMonthExp = expenses
    .filter(e => String(e.month) === String(displayMonth) && !investCatIds.has(e.categoryId))
    .reduce((s, e) => s + (+e.amount || 0), 0)
  const curMonthSav = curMonthInc - curMonthExp

  return (
    <Box className={classes.container}>

      {/* 1. Month Filter */}
      <MonthFilterControl
        selMonths={selMonths}
        setSelMonths={setSelMonths}
        MONTHS={MONTHS}
        defaultMonths={defaultMonths}
        year={year}
      />

      {/* Period summary + current month context */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 16px', mb: '16px', px: '2px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#5b7fff' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6a7190' }}>
            {periodLabel(selMonths, year)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#3a4060' }}>·</Typography>
          <Typography sx={{ fontSize: 12, color: '#3de8a0', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {fmt(selIncome)} earned
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#3a4060' }}>·</Typography>
          <Typography sx={{ fontSize: 12, color: '#ff5f5f', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {fmt(selSpend)} spent
          </Typography>
          {selInvest !== 0 && (
            <>
              <Typography sx={{ fontSize: 12, color: '#3a4060' }}>·</Typography>
              <Typography sx={{ fontSize: 12, color: '#b97fff', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {fmt(selInvest)} invested
              </Typography>
            </>
          )}
        </Box>
        {parseInt(year) >= curYear && selMonths.length > 1 && (
          <>
            <Box sx={{ width: '1px', height: 12, background: 'rgba(255,255,255,0.07)', display: { xs: 'none', sm: 'block' } }} />
            <Typography sx={{ fontSize: 11, color: '#3a4060' }}>
              {displayMonthName} now: {' '}
              <Box component="span" sx={{ color: '#8891b8', fontVariantNumeric: 'tabular-nums' }}>{fmt(curMonthInc)} in</Box>
              {' · '}
              <Box component="span" sx={{ color: '#8891b8', fontVariantNumeric: 'tabular-nums' }}>{fmt(curMonthExp)} out</Box>
              {' · '}
              <Box component="span" sx={{ color: curMonthSav >= 0 ? '#3de8a0' : '#ff5f5f', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(curMonthSav)}</Box>
            </Typography>
          </>
        )}
      </Box>

      {/* 2. Investments moved this period */}
      <InvestmentsSection
        holdings={holdings}
        periodTotal={selInvest}
        periodLabel={periodLabel(selMonths, year)}
        fmt={fmt}
      />


      {/* 5. Budget Overview — full width */}
      <BudgetProgressSection
        categories={categories}
        expenses={expenses}
        selMonths={selMonths}
        catMap={catMap}
        selSpend={selSpend}
        investCatIds={investCatIds}
        onCategoryClick={setDetailModal}
        onEditCategory={onEditCategory}
        fmt={fmt}
        MONTHS={MONTHS}
      />

      {/* 6. Chart Visualization Sections */}
      <ChartsSection
        filteredLabels={filteredLabels}
        monthlyData={monthlyData}
        selMonths={selMonths}
        catTotals={catTotals}
        catColors={catColors}
        isMobile={isMobile}
        fmt={fmt}
        fmtK={fmtK}
        CHART_OPTS={CHART_OPTS}
      />

      {/* 7. Category Pivot Dialog */}
      <CategoryDetailsDialog
        detailModal={detailModal}
        onClose={() => setDetailModal(null)}
        selMonths={selMonths}
        fmt={fmt}
        MONTHS={MONTHS}
      />
    </Box>
  )
}
