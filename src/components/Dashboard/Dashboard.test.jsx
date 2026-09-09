// @vitest-environment jsdom
// Render smoke tests for the Dashboard and its sections.
//
// A missing variable inside JSX is valid syntax, so the build compiles it and
// the crash only appears when the page is opened. Mounting each section here
// catches that in CI instead of in front of the user.
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CATEGORIES, EXPENSES, INCOME, SEL_MONTHS, YEAR, MONTH, noop } from '../../test/fixtures'
import { fmt, fmtK, MONTHS, defaultMonths, CHART_OPTS } from '../../utils/constants'
import { investmentCategoryIds } from '../../utils/money'

// Chart.js needs a real canvas, which jsdom does not provide. The charts are
// third-party rendering; what matters here is that our props reach them.
vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
  Doughnut: () => null,
  Line: () => null,
}))

import Dashboard from './index'
import InvestmentsSection from './subcomponents/InvestmentsSection'
import BudgetProgressSection from './subcomponents/BudgetProgressSection'
import ChartsSection from './subcomponents/ChartsSection'
import MonthFilterControl from './subcomponents/MonthFilterControl'
import CategoryDetailsDialog from './subcomponents/CategoryDetailsDialog'

const year2026 = EXPENSES.filter(e => e.year === '2026')
const inc2026  = INCOME.filter(i => i.year === '2026')
const catMap   = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

const dashboardProps = {
  expenses: year2026, income: inc2026, allExpenses: EXPENSES,
  categories: CATEGORIES, year: YEAR, month: MONTH,
  selMonths: SEL_MONTHS, setSelMonths: noop, onEditCategory: noop,
}

describe('Dashboard', () => {
  it('renders with data', () => {
    expect(() => render(<Dashboard {...dashboardProps} />)).not.toThrow()
  })

  it('renders with no data at all — a brand new account', () => {
    expect(() => render(
      <Dashboard {...dashboardProps} expenses={[]} income={[]} allExpenses={[]} categories={[]} />
    )).not.toThrow()
  })

  it('renders a full-year selection', () => {
    expect(() => render(
      <Dashboard {...dashboardProps} selMonths={[...Array(12).keys()]} />
    )).not.toThrow()
  })

  it('renders a past year, where everything is locked', () => {
    expect(() => render(
      <Dashboard {...dashboardProps} year={2025}
        expenses={EXPENSES.filter(e => e.year === '2025')}
        income={INCOME.filter(i => i.year === '2025')} />
    )).not.toThrow()
  })
})

describe('Dashboard sections', () => {
  it('InvestmentsSection renders, including a pot that went negative this period', () => {
    expect(() => render(
      <InvestmentsSection
        holdings={[
          { name: 'Mutual fund', period: 5000, balance: 83000 },
          { name: 'Gold saving', period: -7684, balance: 16639 },
          { name: 'Closed pot',  period: 0, balance: 0 },
        ]}
        periodTotal={-2684} periodLabel="Sep 2026" fmt={fmt} />
    )).not.toThrow()
  })

  it('InvestmentsSection renders nothing when there are no holdings', () => {
    expect(() => render(
      <InvestmentsSection holdings={[]} periodTotal={0} periodLabel="Sep 2026" fmt={fmt} />
    )).not.toThrow()
  })

  it('BudgetProgressSection renders, over and under budget', () => {
    expect(() => render(
      <BudgetProgressSection
        categories={CATEGORIES} expenses={year2026} selMonths={SEL_MONTHS}
        catMap={catMap} selSpend={19300} investCatIds={investmentCategoryIds(CATEGORIES)}
        onCategoryClick={noop} onEditCategory={noop} fmt={fmt} MONTHS={MONTHS} />
    )).not.toThrow()
  })

  it('BudgetProgressSection survives a zero spend total (no divide-by-zero)', () => {
    expect(() => render(
      <BudgetProgressSection
        categories={CATEGORIES} expenses={year2026} selMonths={SEL_MONTHS}
        catMap={catMap} selSpend={0} investCatIds={investmentCategoryIds(CATEGORIES)}
        onCategoryClick={noop} onEditCategory={noop} fmt={fmt} MONTHS={MONTHS} />
    )).not.toThrow()
  })

  it('ChartsSection renders', () => {
    expect(() => render(
      <ChartsSection
        filteredLabels={['Sep']}
        monthlyData={{ inc: Array(12).fill(0), spend: Array(12).fill(0), kept: Array(12).fill(0) }}
        selMonths={SEL_MONTHS} catTotals={[['FOOD', 4200]]} catColors={['#5b7fff']}
        isMobile={false} fmt={fmt} fmtK={fmtK} CHART_OPTS={CHART_OPTS} />
    )).not.toThrow()
  })

  it('MonthFilterControl renders', () => {
    expect(() => render(
      <MonthFilterControl selMonths={SEL_MONTHS} setSelMonths={noop}
        MONTHS={MONTHS} defaultMonths={defaultMonths} year={YEAR} />
    )).not.toThrow()
  })

  it('CategoryDetailsDialog renders open and closed', () => {
    expect(() => render(
      <CategoryDetailsDialog detailModal={null} onClose={noop}
        selMonths={SEL_MONTHS} fmt={fmt} MONTHS={MONTHS} />
    )).not.toThrow()

    expect(() => render(
      <CategoryDetailsDialog
        detailModal={{
          catName: 'FOOD', color: '#E76F51', total: 4200,
          details: [{ name: 'Groceries', month: 'Sep', amount: 4200 }],
        }}
        onClose={noop} selMonths={SEL_MONTHS} fmt={fmt} MONTHS={MONTHS} />
    )).not.toThrow()
  })
})
