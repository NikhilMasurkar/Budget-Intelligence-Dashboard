import { parseComments, appendComment } from './comments'
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
 * Typing a bare number replaces the amount. Leading with an operator adjusts
 * the CURRENT value instead, so a ₹5,000 expense can be corrected with "+200"
 * rather than doing the sum yourself. Any number of steps can be chained, so
 * several bills can be added in one go:
 *
 *   base 5000, "+200"      -> 5200     "500+200+300" -> 1000
 *   base 5000, "+200+300"  -> 5500     "100+50*2"    -> 200  (× ÷ before + −)
 *
 * Returns { value, label, relative } — label is the sum written out for display
 * ("₹5,000 + ₹200 + ₹300"), null for a bare number; relative is true when it
 * started from the existing amount. Returns null for anything unparseable so
 * the caller never silently writes a wrong number. No eval anywhere near user
 * input. Rounds to 2dp to match how amounts are stored (see money() in parseExcel).
 */
const NUM = String.raw`(?:\d+\.?\d*|\.\d+)`
const EXPR = new RegExp(String.raw`^([+\-*/])?(${NUM}(?:[+\-*/]${NUM})*)$`)
const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' }

export function applyAmountExpression(base, input) {
  const raw = String(input ?? '')
    .replace(/[\s,₹]/g, '')
    .replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    // A trailing operator means the next number is still being typed — read
    // what is there so far instead of flashing an error mid-entry.
    .replace(/[+\-*/]$/, '')
  const m = EXPR.exec(raw)
  if (!m) return null

  const nums = m[2].split(/[+\-*/]/).map(Number)
  const ops = m[2].match(/[+\-*/]/g) || []
  const relative = !!m[1]
  if (relative) { nums.unshift(Number(base) || 0); ops.unshift(m[1]) }
  if (!ops.length) return { value: round2(nums[0]), label: null, relative: false }

  // × and ÷ bind tighter than + and −, the way a phone calculator does it.
  const terms = [nums[0]], signs = []
  for (let i = 0; i < ops.length; i++) {
    const n = nums[i + 1]
    if (ops[i] === '*') terms[terms.length - 1] *= n
    else if (ops[i] === '/') {
      if (n === 0) return null
      terms[terms.length - 1] /= n
    } else { signs.push(ops[i]); terms.push(n) }
  }
  const value = terms.reduce((sum, t, i) => i === 0 ? t : signs[i - 1] === '+' ? sum + t : sum - t, 0)
  if (!Number.isFinite(value)) return null

  // Multipliers are plain numbers ("× 2"); everything else is money.
  const show = (n, op) => (op === '*' || op === '/' ? '' : '₹') + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  let parts = [show(nums[0])]
  ops.forEach((op, i) => parts.push(SYM[op], show(nums[i + 1], op)))
  // "+200+300" on a brand-new expense reads "₹200 + ₹300", not "₹0 + …".
  if (relative && nums[0] === 0 && ops[0] === '+') parts = parts.slice(2)
  return { value: round2(value), label: parts.join(' '), relative }
}

const round2 = (n) => Math.round(n * 100) / 100

// Adding an item that this month already has in the same category ("Tea" again)
// tops up the existing row instead of creating a second "Tea". The top-up is
// logged in its comments: "₹40 + ₹20 = ₹60 — evening". Deposits and
// withdrawals are kept apart (same sign only), so a withdrawal never silently
// nets against a deposit. Returns the merged expense, or null when no match.
// `rows` are sheet-shaped: [id, year, month, categoryId, itemName, amount, isFixed, note].
export function mergeSameItem(rows, exp) {
  const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0
  const key = (s) => String(s ?? '').trim().toLowerCase()
  const add = num(exp.amount)
  const hit = rows.find(r => r[0] && String(r[1]) === String(exp.year) && String(r[2]) === String(exp.month)
    && r[3] === exp.categoryId && key(r[4]) === key(exp.itemName) && (num(r[5]) < 0) === (add < 0))
  if (!hit) return null
  const was = num(hit[5]), total = Math.round((was + add) * 100) / 100
  const inr = (n) => (n < 0 ? '-₹' : '₹') + Math.abs(n).toLocaleString('en-IN')
  const typed = parseComments(exp.note).map(c => c.text).join(' · ')
  const line = `${inr(was)} + ${inr(Math.abs(add))} = ${inr(total)}` + (typed ? ` — ${typed}` : '')
  return {
    ...exp, id: hit[0], itemName: hit[4], amount: total,
    isFixed: hit[6] === 'TRUE' || hit[6] === true || !!exp.isFixed,
    note: appendComment(hit[7], line), added: add, was,
  }
}

// How much a UPI payment adds. New item: the amount typed. Existing item
// (weekly Petrol): "+500" or a bare "500" both mean ₹500 more; the field
// left at its opening total adds nothing, so an untouched edit can't pay twice.
export function upiTopUp({ editing, amount, base, relative, raw }) {
  if (!editing) return amount
  if (relative) return Math.round((amount - base) * 100) / 100
  return String(raw ?? '').trim() === String(base) ? 0 : amount
}
