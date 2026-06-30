import { toSentenceCase } from './constants'

// Default id generator — same shape as api/sheets uid(), but inlined so this
// module stays pure (only depends on constants) and easy to unit-test.
const defaultMakeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ── Expense reconciliation ───────────────────────────────────────────────────
// Merges expenses parsed from the Drive Excel backup (`xlsxExps`, no stable ids)
// with the rows currently in the Google Sheet DB (`dbExpRows`, raw arrays with
// the id in column 0). Returns the full set of rows to persist, and whether
// anything changed (so the caller can skip a no-op write).
//
// CURRENT matching is by the composite key year-month-categoryId-itemName — which
// is why renaming an item orphans it (see milestone 3). Keep behaviour identical
// here; the stable-id change comes next, guarded by these tests.
//
// DB row layout: [id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt]
export function reconcileExpenses(xlsxExps, dbExpRows, makeId = defaultMakeId) {
  const rows = []
  const dbMap = new Map()
  dbExpRows.forEach(row => {
    dbMap.set(`${row[1]}-${row[2]}-${row[3]}-${toSentenceCase(row[4])}`, row)
  })

  let changed = false
  xlsxExps.forEach(xls => {
    const key = `${xls.year}-${xls.month}-${xls.categoryId}-${toSentenceCase(xls.itemName)}`
    const existing = dbMap.get(key)
    if (existing) {
      const amountDiff = String(existing[5]) !== String(xls.amount)
      const fixedDiff  = String(existing[6]) !== String(xls.isFixed || 'FALSE')
      if (amountDiff || fixedDiff) changed = true
      rows.push([
        existing[0], xls.year, xls.month, xls.categoryId,
        toSentenceCase(xls.itemName), xls.amount,
        // Sheets DB wins for isFixed (app pins) and note; Excel is the fallback.
        existing[6] || xls.isFixed || 'FALSE',
        existing[7] || xls.note || '',
        existing[8] || '',
      ])
      dbMap.delete(key)
    } else {
      changed = true
      rows.push([
        xls.id || makeId(), xls.year, xls.month, xls.categoryId,
        toSentenceCase(xls.itemName), xls.amount, xls.isFixed || 'FALSE', xls.note || '', '',
      ])
    }
  })
  // Preserve Sheets-only rows (added in app, not yet in the Drive Excel backup).
  dbMap.forEach(row => { changed = true; rows.push(row) })

  return { rows, changed }
}

// ── Income reconciliation ────────────────────────────────────────────────────
// DB row layout: [id, year, month, source, amount]
export function reconcileIncome(xlsxInc, dbIncRows, makeId = defaultMakeId) {
  const rows = []
  const dbMap = new Map()
  dbIncRows.forEach(row => {
    dbMap.set(`${row[1]}-${row[2]}-${toSentenceCase(row[3])}`, row)
  })

  let changed = false
  xlsxInc.forEach(xls => {
    const key = `${xls.year}-${xls.month}-${toSentenceCase(xls.source)}`
    const existing = dbMap.get(key)
    if (existing) {
      if (String(existing[4]) !== String(xls.amount)) changed = true
      rows.push([existing[0], xls.year, xls.month, toSentenceCase(xls.source), xls.amount])
      dbMap.delete(key)
    } else {
      changed = true
      rows.push([xls.id || makeId(), xls.year, xls.month, toSentenceCase(xls.source), xls.amount])
    }
  })
  dbMap.forEach(row => { changed = true; rows.push(row) })

  return { rows, changed }
}
