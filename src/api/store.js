import { getSheetId, uid } from './session'
import { readRows, writeRows, upsertRows } from './firestoreMonths'

// ── Expenses and income (Firestore) ──────────────────────────────────────────
// The screens speak in rows (see firestoreMonths.js for the shapes); this file
// is the one place they read and write them. Firestore keeps its own copy on
// the device, so every call here also works offline and syncs later.

const sid = () => getSheetId()
const toObjs = (rows, fields) => rows.map(r => Object.fromEntries(fields.map((f, i) => [f, r[i] ?? ''])))
const EXP_FIELDS = ['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note', 'updatedAt']
const INC_FIELDS = ['id', 'year', 'month', 'source', 'amount', 'date']
const sameMonth = (r, y, m) => String(r[1]) === String(y) && String(r[2]) === String(m)
const next = (y, m) => (+m === 12 ? [+y + 1, 1] : [+y, +m + 1])
const prev = (y, m) => (+m === 1 ? [+y - 1, 12] : [+y, +m - 1])

export const readAllExpenseRows = () => readRows(sid(), 'expenses')
export const writeAllExpenseRows = (rows) => writeRows(sid(), 'expenses', rows)
export const readAllIncomeRows = () => readRows(sid(), 'income')
export const writeAllIncomeRows = (rows) => writeRows(sid(), 'income', rows)

export async function fetchExpenses(year) {
  const all = toObjs(await readAllExpenseRows(), EXP_FIELDS)
  return year ? all.filter(e => String(e.year) === String(year)) : all
}
export async function fetchIncome(year) {
  const all = toObjs(await readAllIncomeRows(), INC_FIELDS)
  return year ? all.filter(i => String(i.year) === String(year)) : all
}

// Single-item writers: read → change one row → write. writeRows diffs against
// the read, so only that one entry is actually written.
async function upsertOne(kind, row) {
  const rows = await readRows(sid(), kind)
  const i = rows.findIndex(r => r[0] === row[0])
  if (i >= 0) rows[i] = Object.assign(rows[i], row)   // same array keeps its read origin
  else rows.push(row)
  await writeRows(sid(), kind, rows)
}
async function deleteOne(kind, id) {
  await writeRows(sid(), kind, (await readRows(sid(), kind)).filter(r => r[0] !== id))
}

export const saveExpense = (exp) => upsertOne('expenses', [exp.id || uid(), String(exp.year), String(exp.month),
  exp.categoryId, exp.itemName, exp.amount, exp.isFixed === true || exp.isFixed === 'TRUE' ? 'TRUE' : 'FALSE',
  exp.note || '', 'U' + Date.now()])
export const deleteExpense = (id) => deleteOne('expenses', id)
export const saveIncome = (inc) => upsertOne('income', [inc.id || uid(), String(inc.year), String(inc.month),
  inc.source, inc.amount, inc.date || ''])
export const deleteIncome = (id) => deleteOne('income', id)

export async function copyExpensesToNextMonth(fromYear, fromMonth, selectedIds) {
  const rows = await readAllExpenseRows()
  const [toYear, toMonth] = next(fromYear, fromMonth)
  const dest = rows.filter(r => sameMonth(r, toYear, toMonth))
  const newRows = rows.filter(r => selectedIds.includes(r[0]))
    .filter(f => !dest.some(d => d[3] === f[3] && d[4] === f[4]))
    .map(f => [uid(), String(toYear), String(toMonth), f[3], f[4], f[5], 'FALSE', f[7] || '', 'U' + Date.now()])
  if (newRows.length) await upsertRows(sid(), 'expenses', newRows)
  return { copied: newRows.length, toYear, toMonth }
}

// Copy last month's pinned (isFixed) expenses into toYear/toMonth, skipping any
// already there (same category + item). Returns how many were copied.
export async function autoFixedCopyToMonth(toYear, toMonth) {
  const rows = await readAllExpenseRows()
  const [py, pm] = prev(toYear, toMonth)
  const dest = rows.filter(r => sameMonth(r, toYear, toMonth))
  const newRows = rows.filter(r => sameMonth(r, py, pm) && r[6] === 'TRUE')
    .filter(f => !dest.some(d => d[3] === f[3] && d[4] === f[4]))
    .map(f => [uid(), String(toYear), String(toMonth), f[3], f[4], f[5], 'TRUE', f[7] || '', 'U' + Date.now()])
  if (newRows.length) await upsertRows(sid(), 'expenses', newRows)
  return newRows.length
}
