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
// The rest of the app speaks in ROWS (see api/store.js); this file converts at
// the boundary:
//   expense row: [id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt]
//   income row:  [id, year, month, source, amount, date]

const monthsCol = (sid) => collection(db, 'sheets', sid, 'months')
const monthId = (y, m) => `${String(+y || 0).padStart(4, '0')}-${String(+m || 0).padStart(2, '0')}`
const monthRef = (sid, y, m) => doc(db, 'sheets', sid, 'months', monthId(y, m))

const toAmount = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

const expEntry = (r) => ({
  categoryId: r[3] ?? '', itemName: r[4] ?? '', amount: toAmount(r[5]),
  isFixed: r[6] === true || r[6] === 'TRUE', note: r[7] ?? '', updatedAt: r[8] ?? '',
})
const expRow = (id, y, m, e) => [id, String(y), String(m), e.categoryId, e.itemName, e.amount,
  e.isFixed ? 'TRUE' : 'FALSE', e.note || '', e.updatedAt || '']

const incEntry = (r) => ({ source: r[3] ?? '', amount: toAmount(r[4]), date: r[5] ?? '' })
const incRow = (id, y, m, e) => [id, String(y), String(m), e.source, e.amount, e.date || '']

const KINDS = {
  expenses: { entry: expEntry, row: expRow },
  income: { entry: incEntry, row: incRow },
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

// The row each read handed out → the state it was read from. writeAll diffs
// against THAT read, not whatever was read last, so a save that started
// before some other change can't delete or undo it.
const readFrom = new WeakMap()
const lastRead = {}   // kind → most recent read, for a list emptied of every row it had

async function readMonths(sid, { server = false } = {}) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return server ? getDocsFromServer(monthsCol(sid))
    : offline ? getDocsFromCache(monthsCol(sid))
      : getDocs(monthsCol(sid))
}

export async function readRows(sid, kind, opts) {
  const snap = await readMonths(sid, opts)
  const base = new Map()        // id → { mid, json }
  const rows = []
  snap.docs.forEach(d => {
    const { year, month } = d.data()
    Object.entries(d.data()[kind] || {}).forEach(([id, e]) => {
      const row = KINDS[kind].row(id, year, month, e)
      base.set(id, { mid: d.id, json: JSON.stringify(KINDS[kind].entry(row)) })
      rows.push(row)
    })
  })
  rows.forEach(r => readFrom.set(r, base))
  lastRead[kind] = base
  return rows
}

// Persist `rows` as the complete new list: only entries that differ from the
// read they came from are written, and only ids that read had are deleted.
export async function writeRows(sid, kind, rows) {
  const base = rows.map(r => readFrom.get(r)).find(Boolean) || (rows.length ? new Map() : lastRead[kind] || new Map())
  const ops = []
  const seen = new Set()
  rows.forEach(r => {
    const id = String(r[0] || '')
    if (!id) return
    seen.add(id)
    const entry = KINDS[kind].entry(r)
    const mid = monthId(r[1], r[2])
    const was = base.get(id)
    if (was && was.mid === mid && was.json === JSON.stringify(entry)) return
    ops.push(b => b.set(monthRef(sid, r[1], r[2]), { year: +r[1] || 0, month: +r[2] || 0, [kind]: { [id]: entry } }, { merge: true }))
    // Moved to another month: drop it from the old one.
    if (was && was.mid !== mid) ops.push(b => b.update(doc(db, 'sheets', sid, 'months', was.mid), new FieldPath(kind, id), deleteField()))
  })
  base.forEach((was, id) => {
    if (!seen.has(id)) ops.push(b => b.update(doc(db, 'sheets', sid, 'months', was.mid), new FieldPath(kind, id), deleteField()))
  })
  await commit(ops)
}

// Add or replace entries without deleting anything.
export async function upsertRows(sid, kind, rows) {
  await commit(rows.filter(r => r[0]).map(r => b =>
    b.set(monthRef(sid, r[1], r[2]), { year: +r[1] || 0, month: +r[2] || 0, [kind]: { [String(r[0])]: KINDS[kind].entry(r) } }, { merge: true })))
}

// Firestore caps a batch at 500 writes.
async function commit(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const b = writeBatch(db)
    ops.slice(i, i + 450).forEach(op => op(b))
    await settle(b.commit())
  }
}
