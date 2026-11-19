import { toast } from 'react-hot-toast'
import * as sheets from './sheets'
import { fetchExpenseMetaFS, expensePinKey } from './firestoreExpenseMeta'
import { readRows, replaceAllMonths } from './firestoreMonths'
import { setDbMode, usingFirestore } from './store'
import { compareData } from '../utils/verifyData'
import { toSentenceCase } from '../utils/constants'

// ── One-time move from the Google Sheet to Firestore ─────────────────────────
// 1. Read the Sheet, plus the pins and comments kept in Firestore's expenseMeta.
// 2. Write it all into month documents, keeping every id.
// 3. Read the Sheet again; if it changed meanwhile, copy again (max 3 tries).
// 4. Read the copy back FROM THE SERVER and compare it with the Sheet
//    (utils/verifyData). Any difference at all → don't switch.
// 5. Only then flip settings/db to 'firestore'.
// The Sheet is never modified here. Failing leaves everything as it was.

let running = null
let failedThisSession = false

export function migrateToFirestore(sid, token) {
  if (usingFirestore()) return Promise.resolve(true)
  if (failedThisSession) return Promise.resolve(false)
  if (!running) running = run(sid, token).finally(() => { running = null })
  return running
}

// Same overlay the app applied on load: a pin set in the app wins; the
// Sheet's comment wins unless it's empty.
export function prepareRows(expRows, incRows, meta = {}) {
  const ids = new Set()
  // Blank or repeated ids get a stable stand-in, so no row collapses into another.
  const ensureId = (row, i, kind) => {
    let id = String(row[0] || '')
    if (!id) id = `${kind}-row${i + 2}`
    while (ids.has(id)) id = `${id}-dup`
    ids.add(id)
    row[0] = id
  }
  const blank = (r) => r.every(c => c === '' || c == null)
  const expenses = expRows.filter(r => !blank(r)).map((r, i) => {
    const row = [...r]
    while (row.length < 9) row.push('')
    ensureId(row, i, 'e')
    const m = meta[expensePinKey({ year: row[1], month: row[2], categoryId: row[3], itemName: toSentenceCase(row[4]) })]
    if (m) {
      if ('isFixed' in m) row[6] = m.isFixed ? 'TRUE' : 'FALSE'
      if (!row[7] && m.note) row[7] = m.note
    }
    return row
  })
  const income = incRows.filter(r => !blank(r)).map((r, i) => {
    const row = [...r]
    while (row.length < 6) row.push('')
    ensureId(row, i, 'i')
    return row
  })
  return { expenses, income }
}

async function readSheet(sid, token) {
  sheets.forgetCachedTab(sheets.TABS.EXPENSES)
  sheets.forgetCachedTab(sheets.TABS.INCOME)
  const [exp, inc, meta] = await Promise.all([
    sheets.readAllExpenseRows(token), sheets.readAllIncomeRows(token), fetchExpenseMetaFS(sid),
  ])
  return prepareRows(exp, inc, meta)
}

async function run(sid, token) {
  const id = 'db-migrate'
  toast.loading('Upgrading how your data is stored — one time, a few seconds…', { id })
  try {
    let source = await readSheet(sid, token)
    for (let attempt = 1; ; attempt++) {
      await replaceAllMonths(sid, source.expenses, source.income)
      const again = await readSheet(sid, token)
      if (compareData(source, again).ok) break
      if (attempt === 3) throw new Error('your sheet kept changing during the upgrade')
      source = again
    }
    const stored = {
      expenses: await readRows(sid, 'expenses', { server: true }),
      income: await readRows(sid, 'income', { server: true }),
    }
    const { ok, problems } = compareData(source, stored)
    if (!ok) {
      console.error('[BudgetIQ] Migration check failed:', problems)
      throw new Error(`the copy didn't match the sheet (${problems.length} difference${problems.length > 1 ? 's' : ''}, first: ${problems[0]})`)
    }
    const now = Date.now()
    await setDbMode(sid, 'firestore', {
      migratedAt: now, lastMirrorAt: now,
      migratedCounts: { expenses: source.expenses.length, income: source.income.length },
    })
    toast.success('Upgrade done — saving is now instant, and everything works offline ✓', { id, duration: 5000 })
    return true
  } catch (e) {
    failedThisSession = true
    console.error('[BudgetIQ] Migration postponed:', e)
    toast.error(`Storage upgrade postponed: ${e.message}. Your data is unchanged — it will try again next time.`, { id, duration: 8000 })
    return false
  }
}
