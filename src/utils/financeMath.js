// Budget maths for the AI screen — pure functions, no network.
import { splitSpendInvest } from './money'

export function detectEmployment(income) {
  const sources = income.map(i => (i.source || '').toLowerCase())
  if (sources.some(s => s.includes('salary'))) return 'salaried'
  if (sources.some(s => s.includes('freelance'))) return 'freelancer'
  return 'general'
}

// India new tax regime FY 2025-26 (Budget 2025)
// Standard deduction ₹75,000 for salaried; rebate u/s 87A if taxable ≤ ₹12L
export function calcIncomeTax(annualGross) {
  const taxable = Math.max(0, annualGross - 75000)
  if (taxable <= 1200000) return 0  // full rebate u/s 87A
  if (taxable <= 1600000) return (taxable - 1200000) * 0.20
  if (taxable <= 2000000) return 80000  + (taxable - 1600000) * 0.25
  return 180000 + (taxable - 2000000) * 0.30
}

// ── Instant score — pure JS, zero API calls ──────────────────────────────────
export function calcInstantScore({ expenses, income, categories, selMonths }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const r = n => '₹' + Math.round(n).toLocaleString('en-IN')

  const filtExp = expenses.filter(e => selMonths.includes(+e.month - 1))
  const filtInc = income.filter(i => selMonths.includes(+i.month - 1))
  const activeMonths = Math.max(
    new Set(filtExp.map(e => +e.month - 1)).size,
    new Set(filtInc.map(i => +i.month - 1)).size,
    1
  )

  const totalInc  = filtInc.reduce((s, i) => s + (+i.amount || 0), 0)
  const { spend: totalExp, invest: totalInv, investIds } = splitSpendInvest(filtExp, categories)
  const netSav    = totalInc - totalExp
  const savRate   = totalInc > 0 ? (netSav / totalInc) * 100 : 0
  const monthlyInc = totalInc / activeMonths

  // Investment categories excluded — topCat feeds "X takes N% of income" and
  // "X is your biggest outflow", so an investment winning it would report
  // investing as the user's biggest expense.
  const catTotals = {}
  filtExp.forEach(e => {
    if (investIds.has(e.categoryId)) return
    const cat = catMap[e.categoryId] || 'Other'
    catTotals[cat] = (catTotals[cat] || 0) + (+e.amount || 0)
  })
  const topEntry   = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]
  const topCat     = topEntry?.[0]
  const topMonthly = topEntry ? topEntry[1] / activeMonths : 0
  const topPct     = monthlyInc > 0 ? (topMonthly / monthlyInc * 100).toFixed(0) : 0

  // Off the explicit type flag, not a name match on catTotals (which no longer
  // contains investment categories at all).
  const hasInvest = totalInv !== 0

  let score = 5
  if (netSav < 0)            score -= 3
  else if (savRate >= 20)    score += 2
  else if (savRate >= 10)    score += 1
  if (hasInvest)             score += 1
  if (+topPct > 50)          score -= 1
  score = Math.max(1, Math.min(10, score))

  const employment = income.some(i => (i.source || '').toLowerCase().includes('salary'))
    ? 'salaried'
    : income.some(i => (i.source || '').toLowerCase().includes('freelance'))
    ? 'freelancer'
    : 'general'

  let summary
  if (totalInc === 0) {
    summary = 'No income recorded for this period.'
  } else if (netSav < 0) {
    summary = `Spending ${r(-netSav / activeMonths)}/mo more than you earn.${topCat ? ` ${topCat} is your biggest outflow at ${r(topMonthly)}/mo.` : ''}`
  } else {
    summary = `Saving ${savRate.toFixed(0)}% of income — ${r(netSav / activeMonths)}/mo net.${topCat ? ` ${topCat} takes ${topPct}% of income.` : ''}`
  }

  return { score, summary, employment }
}

// ── Chat helpers ─────────────────────────────────────────────────────────────

export function buildFinancialContext({ expenses, income, categories, selMonths, year, userName }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const r = n => '₹' + Math.round(n).toLocaleString('en-IN')
  const name = userName || 'User'

  const filtExp = expenses.filter(e => selMonths.includes(+e.month - 1))
  const filtInc = income.filter(i => selMonths.includes(+i.month - 1))
  const activeMonths = Math.max(
    new Set(filtExp.map(e => +e.month - 1)).size,
    new Set(filtInc.map(i => +i.month - 1)).size,
    1
  )

  const totalInc = filtInc.reduce((s, i) => s + (+i.amount || 0), 0)
  const { spend: totalExp, invest: totalInv, investIds } = splitSpendInvest(filtExp, categories)
  const netSav   = totalInc - totalExp

  // Investment categories excluded — these lines are printed under "Spending by
  // category" next to a spending total that already excludes them, and the chat
  // model is told to answer using only this data.
  const catTotals = {}
  filtExp.forEach(e => {
    if (investIds.has(e.categoryId)) return
    const cat = catMap[e.categoryId] || 'Other'
    catTotals[cat] = (catTotals[cat] || 0) + (+e.amount || 0)
  })

  const sourceMap = {}
  filtInc.forEach(i => {
    const src = i.source || 'Other'
    sourceMap[src] = (sourceMap[src] || 0) + (+i.amount || 0)
  })

  const catLines = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => `  - ${cat}: ${r(total / activeMonths)}/month`)
    .join('\n')

  const incLines = Object.entries(sourceMap)
    .map(([src, total]) => `  - ${src}: ${r(total / activeMonths)}/month`)
    .join('\n')

  const savPct = totalInc > 0 ? ((netSav / totalInc) * 100).toFixed(1) : '0'

  return `You are a personal finance assistant for ${name} in India.
Their financial data for ${year} (${activeMonths} months of data):

Monthly income: ${r(totalInc / activeMonths)}/month
Income sources:
${incLines}

Monthly spending: ${r(totalExp / activeMonths)}/month (real spending — investments excluded)
Monthly invested: ${r(totalInv / activeMonths)}/month (transfer into their own investments, not spending)
Net savings: ${r(netSav / activeMonths)}/month (${savPct}% of income)

Spending by category (monthly averages):
${catLines}

Guidelines:
- Answer using ONLY the data above. Be specific with ₹ amounts.
- Always say whether an amount is monthly or total.
- Keep replies concise (2–4 sentences) unless asked for detail.
- Address the user as ${name}.`
}
