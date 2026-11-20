import { getSheetId, uid } from './session'
import { readItems, writeItems, upsertItems } from './firestoreMonths'

// ── Expenses and income (Firestore) ──────────────────────────────────────────
// The one place screens read and write them (item shapes: firestoreMonths.js).
// Firestore keeps its own copy on the device, so every call here also works
// offline and syncs later.

const sid = () => getSheetId()
const inMonth = (x, y, m) => String(x.year) === String(y) && String(x.month) === String(m)
const next = (y, m) => (+m === 12 ? [+y + 1, 1] : [+y, +m + 1])
const prev = (y, m) => (+m === 1 ? [+y - 1, 12] : [+y, +m - 1])
const stamp = () => 'U' + Date.now()

export const readAllExpenses = () => readItems(sid(), 'expenses')
export const writeAllExpenses = (items) => writeItems(sid(), 'expenses', items)
export const readAllIncome = () => readItems(sid(), 'income')
export const writeAllIncome = (items) => writeItems(sid(), 'income', items)

const byYear = (items, year) => (year ? items.filter(x => String(x.year) === String(year)) : items)
export const fetchExpenses = async (year) => byYear(await readAllExpenses(), year)
export const fetchIncome = async (year) => byYear(await readAllIncome(), year)

// Single-item writers: read → change one → write. writeItems diffs against the
// read, so only that one item is actually written.
async function upsertOne(kind, item) {
  const items = await readItems(sid(), kind)
  const hit = items.find(x => x.id === item.id)
  if (hit) Object.assign(hit, item)   // same object keeps its read origin
  else items.push(item)
  await writeItems(sid(), kind, items)
}
async function deleteOne(kind, id) {
  await writeItems(sid(), kind, (await readItems(sid(), kind)).filter(x => x.id !== id))
}

export const saveExpense = (exp) => upsertOne('expenses', {
  id: exp.id || uid(), year: String(exp.year), month: String(exp.month), categoryId: exp.categoryId,
  itemName: exp.itemName, amount: exp.amount, isFixed: exp.isFixed === true || exp.isFixed === 'TRUE',
  note: exp.note || '', updatedAt: stamp(),
})
export const deleteExpense = (id) => deleteOne('expenses', id)
export const saveIncome = (inc) => upsertOne('income', {
  id: inc.id || uid(), year: String(inc.year), month: String(inc.month), source: inc.source,
  amount: inc.amount, date: inc.date || '',
})
export const deleteIncome = (id) => deleteOne('income', id)

// Copies of `from` items into year/month, skipping any already there (same
// category + item name).
async function copyInto(from, all, year, month, isFixed) {
  const dest = all.filter(x => inMonth(x, year, month))
  const copies = from.filter(f => !dest.some(d => d.categoryId === f.categoryId && d.itemName === f.itemName))
    .map(f => ({ ...f, id: uid(), year: String(year), month: String(month), isFixed, note: f.note || '', updatedAt: stamp() }))
  if (copies.length) await upsertItems(sid(), 'expenses', copies)
  return copies.length
}

export async function copyExpensesToNextMonth(fromYear, fromMonth, selectedIds) {
  const all = await readAllExpenses()
  const [toYear, toMonth] = next(fromYear, fromMonth)
  const copied = await copyInto(all.filter(x => selectedIds.includes(x.id)), all, toYear, toMonth, false)
  return { copied, toYear, toMonth }
}

// Copy last month's pinned expenses into toYear/toMonth. Returns how many.
export async function autoFixedCopyToMonth(toYear, toMonth) {
  const all = await readAllExpenses()
  const [py, pm] = prev(toYear, toMonth)
  return copyInto(all.filter(x => inMonth(x, py, pm) && x.isFixed), all, toYear, toMonth, true)
}
