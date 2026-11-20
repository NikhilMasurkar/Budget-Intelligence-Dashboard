import { db } from '../firebase'
import {
  collection, doc, getDocs, getDocsFromCache, getDocsFromServer,
  writeBatch, deleteField, FieldPath,
} from 'firebase/firestore'

// ── Expenses and income in Firestore ─────────────────────────────────────────
// One document per month: sheets/{sheetId}/months/{YYYY-MM}
//   { year, month, expenses: { [id]: entry }, income: { [id]: entry } }
//
// A whole year is 12 reads, so loading every year stays far inside the free
// plan. Each expense is its own map entry, written by field path, so editing
// one never rewrites the others — and two devices editing different expenses
// in the same month both keep their change.
//
// Items handed to the app (year and month as strings, as the screens compare):
//   expense: { id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt }
//   income:  { id, year, month, source, amount, date }

const monthsCol = (sid) => collection(db, 'sheets', sid, 'months')
const monthId = (y, m) => `${String(+y || 0).padStart(4, '0')}-${String(+m || 0).padStart(2, '0')}`
const monthRef = (sid, y, m) => doc(db, 'sheets', sid, 'months', monthId(y, m))

export const toAmount = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

// What is stored for each item (everything except id/year/month, which the
// map key and the month document already say).
const ENTRY = {
  expenses: (x) => ({
    categoryId: x.categoryId ?? '', itemName: x.itemName ?? '', amount: toAmount(x.amount),
    isFixed: x.isFixed === true || x.isFixed === 'TRUE', note: x.note ?? '', updatedAt: x.updatedAt ?? '',
  }),
  income: (x) => ({ source: x.source ?? '', amount: toAmount(x.amount), date: x.date ?? '' }),
}

// Writes go to Firestore's local cache at once and reach the server when they
// can. Offline the commit promise never settles, so waiting on it would leave
// a "Saving…" button stuck — wait briefly, then let the cache carry it.
// ponytail: 8s cap; a write still pending after that syncs in the background.
export function settle(promise, ms = 8000) {
  promise.catch(e => console.error('[BudgetIQ] Firestore write failed:', e))
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve()
  return Promise.race([promise, new Promise(r => setTimeout(r, ms))])
}

// The item each read handed out → the state it was read from. writeItems diffs
// against THAT read, not whatever was read last, so a save that started
// before some other change can't delete or undo it.
const readFrom = new WeakMap()
const lastRead = {}   // kind → most recent read, for a list emptied of every item it had

async function readMonths(sid, { server = false } = {}) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return server ? getDocsFromServer(monthsCol(sid))
    : offline ? getDocsFromCache(monthsCol(sid))
      : getDocs(monthsCol(sid))
}

export async function readItems(sid, kind, opts) {
  const snap = await readMonths(sid, opts)
  const base = new Map()        // id → { mid, json }
  const items = []
  snap.docs.forEach(d => {
    const { year, month } = d.data()
    Object.entries(d.data()[kind] || {}).forEach(([id, e]) => {
      const item = { id, year: String(year), month: String(month), ...ENTRY[kind](e) }
      base.set(id, { mid: d.id, json: JSON.stringify(ENTRY[kind](item)) })
      items.push(item)
    })
  })
  items.forEach(x => readFrom.set(x, base))
  lastRead[kind] = base
  return items
}

const setOp = (sid, kind, x) => b => b.set(monthRef(sid, x.year, x.month),
  { year: +x.year || 0, month: +x.month || 0, [kind]: { [String(x.id)]: ENTRY[kind](x) } }, { merge: true })
const dropOp = (sid, kind, mid, id) => b =>
  b.update(doc(db, 'sheets', sid, 'months', mid), new FieldPath(kind, String(id)), deleteField())

// Persist `items` as the complete new list: only items that differ from the
// read they came from are written, and only ids that read had are deleted.
export async function writeItems(sid, kind, items) {
  const base = items.map(x => readFrom.get(x)).find(Boolean) || (items.length ? new Map() : lastRead[kind] || new Map())
  const ops = []
  const seen = new Set()
  items.forEach(x => {
    const id = String(x.id || '')
    if (!id) return
    seen.add(id)
    const mid = monthId(x.year, x.month)
    const was = base.get(id)
    if (was && was.mid === mid && was.json === JSON.stringify(ENTRY[kind](x))) return
    ops.push(setOp(sid, kind, x))
    if (was && was.mid !== mid) ops.push(dropOp(sid, kind, was.mid, id))   // moved month
  })
  base.forEach((was, id) => { if (!seen.has(id)) ops.push(dropOp(sid, kind, was.mid, id)) })
  await commit(ops)
}

// Add or replace items without deleting anything.
export async function upsertItems(sid, kind, items) {
  await commit(items.filter(x => x.id).map(x => setOp(sid, kind, x)))
}

// Firestore caps a batch at 500 writes.
async function commit(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const b = writeBatch(db)
    ops.slice(i, i + 450).forEach(op => op(b))
    await settle(b.commit())
  }
}
