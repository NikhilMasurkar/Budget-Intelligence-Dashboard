import React, { useMemo, useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { useStyles } from './styles/Dashboard.styles'
import CurrentMonthSummary from './subcomponents/CurrentMonthSummary'
import MonthFilterControl from './subcomponents/MonthFilterControl'
import KPICardsSection from './subcomponents/KPICardsSection'
import WealthCardsSection from './subcomponents/WealthCardsSection'
import ChartsSection from './subcomponents/ChartsSection'
import TopExpensesTable from '../Expenses/TopExpensesTable'
import CategoryDetailsDialog from './subcomponents/CategoryDetailsDialog'
import { MONTHS, fmt, fmtK,defaultMonths,CHART_OPTS } from '../../utils/constants'

export default function Dashboard({ expenses, income, categories, year, month, filterMonth }) {
  const { classes } = useStyles()
  const [selMonths, setSelMonths] = useState(() => defaultMonths(year))
  const [detailModal, setDetailModal] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // When year changes → reset to smart default for that year
  useEffect(() => {
    setSelMonths(defaultMonths(year))
  }, [year])

  // When filterMonth changes from OUTSIDE (not null) → select just that month
  useEffect(() => {
    if (filterMonth !== null && filterMonth >= 1 && filterMonth <= 12) {
      setSelMonths([filterMonth - 1])
    } else if (filterMonth === null) {
      setSelMonths(defaultMonths(year))
    }
  }, [filterMonth])

  // Treat these category names as "investments" (savings outflows, not spending)
  const INVEST_NAMES = useMemo(() =>
    new Set(['INVESTMENTS & SAVINGS', 'FINANCIAL OBLIGATIONS', 'INVESTMENT', 'SAVINGS'].map(n => n.toUpperCase()))
  , [])

  const investCatIds = useMemo(() =>
    new Set(categories.filter(c => INVEST_NAMES.has(c.name.toUpperCase())).map(c => c.id))
  , [categories, INVEST_NAMES])

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
      sav:       inc.map((v, i) => v - exp[i]),
      trueSav:   inc.map((v, i) => v - spend[i]),
      wealthBuilt: inc.map((v, i) => v - spend[i]),
    }
  }, [income, expenses, investCatIds])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  // Category totals for selected months
  const catTotals = useMemo(() => {
    const t = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      const cat = catMap[e.categoryId]?.name || e.categoryId || 'Other'
      t[cat] = (t[cat] || 0) + (+e.amount || 0)
    })
    return Object.entries(t).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])
  }, [expenses, catMap, selMonths])

  // Investment breakdown by item for selected months
  const investBreakdown = useMemo(() => {
    const breakdown = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      if (investCatIds.has(e.categoryId)) {
        const name = e.itemName || 'Unnamed'
        breakdown[name] = (breakdown[name] || 0) + (+e.amount || 0)
      }
    })
    return Object.entries(breakdown).filter(([,v]) => v > 0).sort((a,b) => b[1] - a[1])
  }, [expenses, selMonths, investCatIds])

  // Selected period totals
  const selIncome    = selMonths.reduce((s,i) => s + monthlyData.inc[i],   0)
  const selExpense   = selMonths.reduce((s,i) => s + monthlyData.exp[i],   0)
  const selInvest    = selMonths.reduce((s,i) => s + monthlyData.inv[i],   0)
  const selSpend     = selMonths.reduce((s,i) => s + monthlyData.spend[i], 0)
  const selNetSav    = selIncome - selExpense
  const selTrueSav   = selIncome - selSpend
  const selWealth    = selTrueSav

  const savRate      = selIncome > 0 ? (selNetSav  / selIncome * 100).toFixed(1) : 0
  const investRate   = selIncome > 0 ? (selInvest  / selIncome * 100).toFixed(1) : 0
  const wealthRate   = selIncome > 0 ? (selWealth  / selIncome * 100).toFixed(1) : 0
  const expRate      = selIncome > 0 ? (selExpense / selIncome * 100).toFixed(1) : 0

  const filteredLabels = selMonths.map(i => MONTHS[i])
  const catColors = ['#5b7fff','#3de8a0','#ff5f5f','#b97fff','#ffb347','#ff6eb4','#60c0ff','#ffd700','#ff8c69','#7fffd4']

  const curYear = new Date().getFullYear()
  const displayMonth = (year === curYear) ? (new Date().getMonth() + 1) : month
  const displayMonthName = MONTHS[displayMonth - 1]

  const curMonthInc = income.filter(i => String(i.month) === String(displayMonth)).reduce((s, i) => s + (+i.amount || 0), 0)
  const curMonthExp = expenses.filter(e => String(e.month) === String(displayMonth)).reduce((s, e) => s + (+e.amount || 0), 0)
  const curMonthSav = curMonthInc - curMonthExp

  return (
    <Box className={classes.container}>
      {/* 1. Summary Cards (Current Month) */}
      {parseInt(year) >= curYear && (
        <CurrentMonthSummary
          displayMonthName={displayMonthName}
          year={year}
          curMonthInc={curMonthInc}
          curMonthExp={curMonthExp}
          curMonthSav={curMonthSav}
          fmt={fmt}
        />
      )}

      {/* 2. Month Filters Control */}
      <MonthFilterControl
        selMonths={selMonths}
        setSelMonths={setSelMonths}
        MONTHS={MONTHS}
        defaultMonths={defaultMonths}
        year={year}
      />

      {/* 3. Core Financial KPI Cards */}
      <KPICardsSection
        selIncome={selIncome}
        selExpense={selExpense}
        selNetSav={selNetSav}
        selMonths={selMonths}
        catTotals={catTotals}
        expRate={expRate}
        savRate={savRate}
        fmt={fmt}
      />

      {/* 4. Wealth / Investment Breakdown Cards */}
      <WealthCardsSection
        selInvest={selInvest}
        investRate={investRate}
        investBreakdown={investBreakdown}
        selNetSav={selNetSav}
        savRate={savRate}
        selWealth={selWealth}
        wealthRate={wealthRate}
        fmt={fmt}
        selMonths={selMonths}
      />

      {/* 5. Chart Visualization Sections */}
      <ChartsSection
        filteredLabels={filteredLabels}
        monthlyData={monthlyData}
        selMonths={selMonths}
        catTotals={catTotals}
        catColors={catColors}
        isMobile={isMobile}
        expenses={expenses}
        catMap={catMap}
        fmt={fmt}
        fmtK={fmtK}
        CHART_OPTS={CHART_OPTS}
      />

      {/* 6. Top Expenses Breakdown List */}
      <TopExpensesTable
        expenses={expenses}
        selMonths={selMonths}
        catMap={catMap}
        selExpense={selExpense}
        onCategoryClick={setDetailModal}
        fmt={fmt}
        MONTHS={MONTHS}
      />

      {/* 7. Category Pivot PivotTable Dialog */}
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
