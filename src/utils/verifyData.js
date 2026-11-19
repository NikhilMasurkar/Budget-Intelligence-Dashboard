// ── Compare two copies of the data ───────────────────────────────────────────
// Used before switching storage: the migration only flips the switch when the
// new copy matches the old one exactly. Checks, from coarse to fine:
//   • number of expenses / income entries per month
//   • total amount per month, and per month + category
//   • every id present in both, with the same fields
// Rows are sheet-shaped (see api/firestoreMonths.js). Returns { ok, problems }.

const num = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}
const ym = (r) => `${+r[1] || 0}-${+r[2] || 0}`
const fixed = (v) => v === true || v === 'TRUE'

function tally(rows, keyOf, amountIdx) {
  const m = new Map()
  rows.forEach(r => {
    const k = keyOf(r)
    const t = m.get(k) || { count: 0, sum: 0 }
    t.count++
    t.sum = Math.round((t.sum + num(r[amountIdx])) * 100) / 100
    m.set(k, t)
  })
  return m
}

function compareTallies(label, a, b, problems) {
  new Set([...a.keys(), ...b.keys()]).forEach(k => {
    const x = a.get(k) || { count: 0, sum: 0 }, y = b.get(k) || { count: 0, sum: 0 }
    if (x.count !== y.count) problems.push(`${label} ${k}: ${x.count} entries before, ${y.count} after`)
    else if (x.sum !== y.sum) problems.push(`${label} ${k}: total ₹${x.sum} before, ₹${y.sum} after`)
  })
}

function compareById(label, a, b, fields, problems) {
  const byId = new Map(b.filter(r => r[0]).map(r => [String(r[0]), r]))
  a.forEach(r => {
    if (!r[0]) return
    const other = byId.get(String(r[0]))
    if (!other) { problems.push(`${label} ${r[0]} (${r[4] ?? r[3]}) is missing`); return }
    fields.forEach(([name, i, norm]) => {
      if (norm(r[i]) !== norm(other[i])) problems.push(`${label} ${r[0]}: ${name} "${r[i]}" became "${other[i]}"`)
    })
  })
}

const str = (v) => String(v ?? '')

export function compareData(before, after) {
  const problems = []
  compareTallies('Expenses', tally(before.expenses, ym, 5), tally(after.expenses, ym, 5), problems)
  compareTallies('Expenses', tally(before.expenses, r => `${ym(r)} ${r[3]}`, 5), tally(after.expenses, r => `${ym(r)} ${r[3]}`, 5), problems)
  compareTallies('Income', tally(before.income, ym, 4), tally(after.income, ym, 4), problems)
  compareById('Expense', before.expenses, after.expenses, [
    ['month', 2, v => +v || 0], ['year', 1, v => +v || 0], ['category', 3, str], ['name', 4, str],
    ['amount', 5, num], ['pin', 6, fixed], ['comments', 7, str],
  ], problems)
  compareById('Income', before.income, after.income, [
    ['month', 2, v => +v || 0], ['year', 1, v => +v || 0], ['source', 3, str], ['amount', 4, num], ['date', 5, str],
  ], problems)
  return { ok: problems.length === 0, problems }
}
