// Investment and multi-year aggregation helpers.
//
// Kept out of the components because the boundaries are where the bugs live:
// every function here is bounded by an explicit [fromKey, toKey] month range and
// must cross year boundaries correctly.
//
// The Dashboard passes a bounded range (the selected months of one year). The
// Balance Sheet passes an open start so balances accumulate from the beginning.
// Same function — the CALLER decides the scope, so the two views can never
// silently disagree about what period they are showing.

// Chronological ordering key so months compare correctly across years.
export const monthKey = (y, m) => (+y) * 12 + (+m - 1)

/**
 * One row per year: what came in, what was spent, what was invested, what was
 * kept. Years with no activity are omitted.
 *   kept = earned − spent   (investing is a transfer, never spending)
 */
export function computeYearlySummary({ allIncome = [], allExpenses = [], investCatIds }) {
  const years = new Map()
  const row = (y) => {
    const k = String(y)
    if (!years.has(k)) years.set(k, { year: k, earned: 0, spent: 0, invested: 0, kept: 0 })
    return years.get(k)
  }

  allIncome.forEach(i => { row(i.year).earned += +i.amount || 0 })
  allExpenses.forEach(e => {
    const r = row(e.year)
    const amt = +e.amount || 0
    if (investCatIds.has(e.categoryId)) r.invested += amt
    else r.spent += amt
  })

  return [...years.values()]
    .map(r => ({ ...r, kept: r.earned - r.spent }))
    .filter(r => r.earned !== 0 || r.spent !== 0 || r.invested !== 0)
    .sort((a, b) => a.year.localeCompare(b.year))
}

/**
 * Investment items as rows, years as columns, plus a running balance per item.
 * The Balance Sheet's core table — it shows how each holding was built up year
 * by year, which a single cumulative number cannot.
 */
export function computeHoldingsMatrix({ allExpenses = [], investCatIds }) {
  const byName = new Map()
  const yearSet = new Set()

  allExpenses.forEach(e => {
    if (!investCatIds.has(e.categoryId)) return
    const name = e.itemName || 'Unnamed'
    const y = String(e.year)
    yearSet.add(y)
    if (!byName.has(name)) byName.set(name, { name, byYear: {}, balance: 0 })
    const h = byName.get(name)
    const amt = +e.amount || 0
    h.byYear[y] = (h.byYear[y] || 0) + amt
    h.balance += amt
  })

  const years = [...yearSet].sort()
  const rows = [...byName.values()]
    .filter(h => h.balance !== 0)
    .sort((a, b) => b.balance - a.balance)

  const totals = { byYear: {}, balance: 0 }
  rows.forEach(h => {
    years.forEach(y => { totals.byYear[y] = (totals.byYear[y] || 0) + (h.byYear[y] || 0) })
    totals.balance += h.balance
  })

  return { years, rows, totals }
}

/**
 * Overall position across all years.
 *   kept = earned − spent          (investing is a transfer, never spending)
 *   cash = kept   − invested       (what was kept and NOT put into investments)
 *
 * `invested` is the NET figure: a withdrawal moved money back out of an
 * investment and into cash, so it must reduce `invested` and raise `cash` by
 * the same amount, leaving `kept` untouched.
 *
 * This counts only what has been recorded — it is not a bank balance, because
 * money held before tracking began was never entered.
 */
export function computePosition({ allIncome = [], allExpenses = [], investCatIds }) {
  let earned = 0, spent = 0, invested = 0
  allIncome.forEach(i => { earned += +i.amount || 0 })
  allExpenses.forEach(e => {
    const amt = +e.amount || 0
    if (investCatIds.has(e.categoryId)) invested += amt
    else spent += amt
  })
  const kept = earned - spent
  return { earned, spent, kept, invested, cash: kept - invested }
}

/**
 * Per investment: what moved inside [fromKey, toKey], AND the running balance
 * up to toKey (carrying forward every earlier year).
 *
 * Both are needed together. Period movement alone goes negative whenever a
 * withdrawal exceeds that period's deposits — which looks broken even though
 * the pot still holds money from earlier years. The balance alone hides what
 * actually happened this period. Showing them side by side under explicit
 * column headers is what removes the ambiguity.
 */
export function computeHoldingsWithBalance({ allExpenses = [], investCatIds, fromKey = null, toKey }) {
  if (toKey == null) return []
  const byName = new Map()

  allExpenses.forEach(e => {
    if (!investCatIds.has(e.categoryId)) return
    const k = monthKey(e.year, e.month)
    if (k > toKey) return

    const name = e.itemName || 'Unnamed'
    const amt  = +e.amount || 0
    const cur  = byName.get(name) || { name, period: 0, balance: 0 }
    cur.balance += amt
    if (fromKey == null || k >= fromKey) cur.period += amt
    byName.set(name, cur)
  })

  return [...byName.values()]
    .filter(h => h.balance !== 0 || h.period !== 0)
    .sort((a, b) => b.balance - a.balance)
}
