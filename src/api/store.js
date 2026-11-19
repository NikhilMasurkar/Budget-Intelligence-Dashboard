import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import * as sheets from './sheets'
import { readRows, writeRows, upsertRows } from './firestoreMonths'

// ── Where expenses and income live ───────────────────────────────────────────
// Same function names and row shapes as api/sheets.js, so the hooks and screens
// don't care which store is behind them. Which one is decided per spreadsheet
// by sheets/{sid}/settings/db → { source: 'firestore' | 'sheets' }, written by
// the one-time migration (api/migrate.js).
//
// ROLLBACK: set that doc's `source` to 'sheets' in the Firebase console. The
// Google Sheet is kept as an up-to-date copy (see mirror in useBudgetData), so
// nothing entered since the switch is lost by going back.

let _mode = 'sheets'
export const usingFirestore = () => _mode === 'firestore'
const modeKey = (sid) => `budgetiq_db_${sid}`
const dbRef = (sid) => doc(db, 'sheets', sid, 'settings', 'db')

// Settle the mode before any data call. Offline, trust what this phone last saw.
export async function resolveDbMode(sid) {
  if (!sid) { _mode = 'sheets'; return _mode }
  let cached = null
  try { cached = localStorage.getItem(modeKey(sid)) } catch { /* private mode */ }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    _mode = cached === 'firestore' ? 'firestore' : 'sheets'
    return _mode
  }
  try {
    const snap = await getDoc(dbRef(sid))
    _mode = snap.exists() && snap.data().source === 'firestore' ? 'firestore' : 'sheets'
  } catch {
    _mode = cached === 'firestore' ? 'firestore' : 'sheets'
  }
  try { localStorage.setItem(modeKey(sid), _mode) } catch { /* fine */ }
  return _mode
}

export async function setDbMode(sid, source, extra = {}) {
  await setDoc(dbRef(sid), { source, ...extra, updatedAt: Date.now() }, { merge: true })
  _mode = source
  try { localStorage.setItem(modeKey(sid), source) } catch { /* fine */ }
}
export async function getDbSettings(sid) {
  try { const s = await getDoc(dbRef(sid)); return s.exists() ? s.data() : {} } catch { return {} }
}

// Firestore keeps working offline, so it needs no Google token to save; the
// Sheet does. Handlers check for a token before writing — this gives them one.
export const getWriteToken = () => sheets.getToken() || (usingFirestore() ? 'firestore' : null)

// Changes that the Sheet can't queue offline. Firestore can, so it never blocks.
export function requireConnection() {
  if (usingFirestore() || typeof navigator === 'undefined' || navigator.onLine !== false) return
  const msg = 'Needs a connection — you can still add new expenses offline'
  import('react-hot-toast').then(({ toast }) => toast.error(msg, { id: 'needs-connection' }))
  throw new Error(msg)
}

const sid = () => sheets.getSheetId()
const fs = usingFirestore
const toObjs = (rows, fields) => rows.map(r => Object.fromEntries(fields.map((f, i) => [f, r[i] ?? ''])))
const EXP_FIELDS = ['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note', 'updatedAt']
const INC_FIELDS = ['id', 'year', 'month', 'source', 'amount', 'date']

export const readAllExpenseRows = (t) => fs() ? readRows(sid(), 'expenses') : sheets.readAllExpenseRows(t)
export const writeAllExpenseRows = (rows, t) => fs() ? writeRows(sid(), 'expenses', rows) : sheets.writeAllExpenseRows(rows, t)
export const readAllIncomeRows = (t) => fs() ? readRows(sid(), 'income') : sheets.readAllIncomeRows(t)
export const writeAllIncomeRows = (rows, t) => fs() ? writeRows(sid(), 'income', rows) : sheets.writeAllIncomeRows(rows, t)

export function appendRows(tab, rows, t) {
  if (!fs()) return sheets.appendRows(tab, rows, t)
  return upsertRows(sid(), tab === sheets.TABS.INCOME ? 'income' : 'expenses', rows)
}
export const forgetCachedTab = (tab) => { if (!fs()) sheets.forgetCachedTab(tab) }

export async function fetchExpenses(year, t) {
  if (!fs()) return sheets.fetchExpenses(year, t)
  const all = toObjs(await readRows(sid(), 'expenses'), EXP_FIELDS)
  return year ? all.filter(e => String(e.year) === String(year)) : all
}
export async function fetchIncome(year, t) {
  if (!fs()) return sheets.fetchIncome(year, t)
  const all = toObjs(await readRows(sid(), 'income'), INC_FIELDS)
  return year ? all.filter(i => String(i.year) === String(year)) : all
}

// The single-item writers below are read → change one row → write: the diff in
// writeRows turns that into a write of just that one entry.
export async function saveExpense(exp, t) {
  if (!fs()) return sheets.saveExpense(exp, t)
  const rows = await readRows(sid(), 'expenses')
  const row = [exp.id || sheets.uid(), String(exp.year), String(exp.month), exp.categoryId, exp.itemName,
    exp.amount, exp.isFixed === true || exp.isFixed === 'TRUE' ? 'TRUE' : 'FALSE', exp.note || '', 'U' + Date.now()]
  const i = rows.findIndex(r => r[0] === row[0])
  if (i >= 0) rows[i] = Object.assign(rows[i], row)   // same array object keeps its read origin
  else rows.push(row)
  await writeRows(sid(), 'expenses', rows)
}
export async function deleteExpense(id, t) {
  if (!fs()) return sheets.deleteExpense(id, t)
  await writeRows(sid(), 'expenses', (await readRows(sid(), 'expenses')).filter(r => r[0] !== id))
}
export async function saveIncome(inc, t) {
  if (!fs()) return sheets.saveIncome(inc, t)
  const rows = await readRows(sid(), 'income')
  const row = [inc.id || sheets.uid(), String(inc.year), String(inc.month), inc.source, inc.amount, inc.date || '']
  const i = rows.findIndex(r => r[0] === row[0])
  if (i >= 0) rows[i] = Object.assign(rows[i], row)
  else rows.push(row)
  await writeRows(sid(), 'income', rows)
}
export async function deleteIncome(id, t) {
  if (!fs()) return sheets.deleteIncome(id, t)
  await writeRows(sid(), 'income', (await readRows(sid(), 'income')).filter(r => r[0] !== id))
}

export async function copyExpensesToNextMonth(fromYear, fromMonth, selectedIds, t) {
  if (!fs()) return sheets.copyExpensesToNextMonth(fromYear, fromMonth, selectedIds, t)
  const all = toObjs(await readRows(sid(), 'expenses'), EXP_FIELDS)
  let toYear = parseInt(fromYear), toMonth = parseInt(fromMonth) + 1
  if (toMonth > 12) { toMonth = 1; toYear++ }
  const exist = all.filter(e => String(e.year) === String(toYear) && String(e.month) === String(toMonth))
  const newRows = all.filter(e => selectedIds.includes(e.id))
    .filter(f => !exist.some(x => x.categoryId === f.categoryId && x.itemName === f.itemName))
    .map(f => [sheets.uid(), String(toYear), String(toMonth), f.categoryId, f.itemName, f.amount, 'FALSE', f.note || '', 'U' + Date.now()])
  if (newRows.length) await upsertRows(sid(), 'expenses', newRows)
  return { copied: newRows.length, toYear, toMonth }
}

export async function autoFixedCopyToMonth(toYear, toMonth, t) {
  if (!fs()) return sheets.autoFixedCopyToMonth(toYear, toMonth, t)
  const rows = await readRows(sid(), 'expenses')
  let prevY = toYear, prevM = toMonth - 1
  if (prevM === 0) { prevM = 12; prevY-- }
  const fixed = rows.filter(r => String(r[1]) === String(prevY) && String(r[2]) === String(prevM) && r[6] === 'TRUE')
  const dest = rows.filter(r => String(r[1]) === String(toYear) && String(r[2]) === String(toMonth))
  const newRows = fixed.filter(f => !dest.some(d => d[3] === f[3] && d[4] === f[4]))
    .map(f => [sheets.uid(), String(toYear), String(toMonth), f[3], f[4], f[5], 'TRUE', f[7] || '', 'U' + Date.now()])
  if (newRows.length) await upsertRows(sid(), 'expenses', newRows)
  return newRows.length
}
