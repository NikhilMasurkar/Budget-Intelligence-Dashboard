// SINGLE SOURCE OF TRUTH for the one distinction this whole app rests on:
//
//   SPENDING  — money that leaves for good (rent, food, fuel)
//   INVESTING — money moved between your own pockets (SIP, gold, PPF)
//
// Investing is a TRANSFER, not an expense. A withdrawal is the same transfer in
// reverse, stored as a negative amount, and is NOT income.
//
// This definition used to be re-implemented in seven places — the Dashboard, the
// Excel export, the PDF export, the expenses list, two modals and the AI layer —
// with two different implementations (an explicit type check in most, a fuzzy
// name match in the AI). They drifted, and the app ended up telling the user one
// number on screen and a different one in their spreadsheet. Every caller now
// imports from here, so there is exactly one place to change and one place to be
// wrong.

export const SAVINGS_TYPE = 'savings'
export const EXPENSE_TYPE = 'expense'

/** True when a category holds investments/savings rather than spending. */
export function isInvestmentCategory(cat) {
  return cat?.type === SAVINGS_TYPE
}

/** Set of category ids that hold investments — the usual lookup for row filtering. */
export function investmentCategoryIds(categories = []) {
  return new Set(categories.filter(isInvestmentCategory).map(c => c.id))
}

/** True when an expense row is an investment transfer rather than spending. */
export function isInvestmentRow(row, investIds) {
  return investIds.has(row?.categoryId)
}

/**
 * Split expense rows into real spending vs net investing.
 * `invest` nets deposits against withdrawals, so it can legitimately be negative.
 * Returns `investIds` too, since callers almost always need it to filter further.
 */
export function splitSpendInvest(expenses = [], categories = []) {
  const investIds = investmentCategoryIds(categories)
  let spend = 0, invest = 0
  expenses.forEach(e => {
    const amt = +e.amount || 0
    if (investIds.has(e.categoryId)) invest += amt
    else spend += amt
  })
  return { spend, invest, investIds }
}

/**
 * Split a withdrawal across holdings in proportion to their balances.
 *
 * Used by the "All investments" option so taking money out reduces each pot by
 * its fair share rather than landing on one unattributed row.
 *
 * Rounds to whole rupees and gives the remainder to the largest holding, so the
 * parts always sum EXACTLY to `amount` — a proportional split that silently
 * loses or invents a few rupees is how balances drift out of step.
 *
 * @returns [{ name, amount }] with positive amounts; the caller applies the sign.
 */
export function splitWithdrawal(amount, holdings = []) {
  const total = holdings.reduce((s, h) => s + Math.max(0, h.balance), 0)
  if (!(amount > 0) || total <= 0) return []

  const parts = holdings
    .filter(h => h.balance > 0)
    .map(h => ({ name: h.name, amount: Math.round((h.balance / total) * amount) }))

  if (!parts.length) return []

  // Hand any rounding difference to the biggest holding.
  const diff = amount - parts.reduce((s, p) => s + p.amount, 0)
  if (diff !== 0) {
    const biggest = parts.reduce((a, b) => (b.amount > a.amount ? b : a))
    biggest.amount += diff
  }

  return parts.filter(p => p.amount !== 0)
}

/**
 * Apply an arithmetic expression to an existing amount.
 *
 * Typing a bare number replaces the amount as before. Leading with an operator
 * adjusts the CURRENT value instead, so a ₹5,000 expense can be corrected with
 * "+200" rather than doing the sum yourself:
 *
 *   base 5000, "+200" -> 5200      base 5000, "*2"  -> 10000
 *   base 5000, "-10"  -> 4990      base 5000, "/2"  -> 2500
 *
 * Returns null for anything unparseable so the caller can leave the field alone
 * rather than silently writing a wrong number. Rounds to 2dp to match how
 * amounts are stored (see money() in parseExcel).
 */
export function applyAmountExpression(base, input) {
  const raw = String(input ?? '').trim().replace(/\s+/g, '')
  if (!raw) return null

  const m = /^([+\-*/])(.+)$/.exec(raw)
  if (!m) {
    const abs = Number(raw)
    return Number.isFinite(abs) ? { value: round2(abs), op: null, operand: null } : null
  }

  const [, op, rest] = m
  const operand = Number(rest)
  if (!Number.isFinite(operand)) return null

  const b = Number(base) || 0
  let value
  if (op === '+') value = b + operand
  else if (op === '-') value = b - operand
  else if (op === '*') value = b * operand
  else if (op === '/') value = operand === 0 ? null : b / operand

  if (value == null || !Number.isFinite(value)) return null
  return { value: round2(value), op, operand }
}

const round2 = (n) => Math.round(n * 100) / 100
