import { toSentenceCase } from './constants'

// Default id generator — same shape as api/sheets uid(), but inlined so this
// module stays pure (only depends on constants) and easy to unit-test.
const defaultMakeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ── Expense reconciliation ───────────────────────────────────────────────────
// Merges expenses parsed from the Drive Excel backup with the Google Sheet DB.
// Matching strategy (in priority order):
//   1. Stable id match — exportExcel embeds month→id in cell A notes; parseExcel
//      recovers them, so `xls.id` now equals the original DB row id. This survives
//      renames and recategorisations that would fool the name-composite key.
//   2. Name-composite fallback — year-month-categoryId-itemName, for old backups
//      that pre-date the id embedding (SHEET_FORMAT_VERSION < 3).
//
// DB row layout: [id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt]
export function reconcileExpenses(xlsxExps, dbExpRows, makeId = defaultMakeId) {
  const rows = []
  const dbById  = new Map()   // id → row (primary)
  const dbByKey = new Map()   // year-month-cat-name → row (fallback)

  dbExpRows.forEach(row => {
    if (row[0]) dbById.set(row[0], row)
    dbByKey.set(`${row[1]}-${row[2]}-${row[3]}-${toSentenceCase(row[4])}`, row)
  })

  let changed = false
  const matchedIds = new Set()

  xlsxExps.forEach(xls => {
    // 1. Try stable-id match (survives renames / recategorisations).
    let existing = xls.id ? dbById.get(xls.id) : null

    // 2. Fall back to name-composite for legacy backups without embedded ids.
    if (!existing) {
      const key = `${xls.year}-${xls.month}-${xls.categoryId}-${toSentenceCase(xls.itemName)}`
      existing = dbByKey.get(key)
    }

    if (existing) {
      matchedIds.add(existing[0])
      // Remove from both maps so the same DB row can't be matched twice.
      dbById.delete(existing[0])
      dbByKey.delete(`${existing[1]}-${existing[2]}-${existing[3]}-${toSentenceCase(existing[4])}`)

      const amountDiff = String(existing[5]) !== String(xls.amount)
      const fixedDiff  = String(existing[6]) !== String(xls.isFixed || 'FALSE')
      const nameDiff   = toSentenceCase(existing[4]) !== toSentenceCase(xls.itemName)
      if (amountDiff || fixedDiff || nameDiff) changed = true
      rows.push([
        existing[0], xls.year, xls.month, xls.categoryId,
        toSentenceCase(xls.itemName), xls.amount,
        // Sheets DB wins for isFixed (app pins) and note; Excel is the fallback.
        existing[6] || xls.isFixed || 'FALSE',
        existing[7] || xls.note || '',
        existing[8] || '',
      ])
    } else {
      changed = true
      rows.push([
        makeId(), xls.year, xls.month, xls.categoryId,
        toSentenceCase(xls.itemName), xls.amount, xls.isFixed || 'FALSE', xls.note || '', '',
      ])
    }
  })

  // Preserve Sheets-only rows (added in app, not yet in the Drive Excel backup).
  dbExpRows.forEach(row => {
    if (!matchedIds.has(row[0])) { changed = true; rows.push(row) }
  })

  return { rows, changed }
}

// ── Income reconciliation ────────────────────────────────────────────────────
// Same two-level matching as reconcileExpenses: id first, name-composite fallback.
// DB row layout: [id, year, month, source, amount]
export function reconcileIncome(xlsxInc, dbIncRows, makeId = defaultMakeId) {
  const rows = []
  const dbById  = new Map()
  const dbByKey = new Map()

  dbIncRows.forEach(row => {
    if (row[0]) dbById.set(row[0], row)
    dbByKey.set(`${row[1]}-${row[2]}-${toSentenceCase(row[3])}`, row)
  })

  let changed = false
  const matchedIds = new Set()

  xlsxInc.forEach(xls => {
    let existing = xls.id ? dbById.get(xls.id) : null
    if (!existing) {
      existing = dbByKey.get(`${xls.year}-${xls.month}-${toSentenceCase(xls.source)}`)
    }
    if (existing) {
      matchedIds.add(existing[0])
      dbById.delete(existing[0])
      dbByKey.delete(`${existing[1]}-${existing[2]}-${toSentenceCase(existing[3])}`)

      const amountDiff  = String(existing[4]) !== String(xls.amount)
      const sourceDiff  = toSentenceCase(existing[3]) !== toSentenceCase(xls.source)
      if (amountDiff || sourceDiff) changed = true
      rows.push([existing[0], xls.year, xls.month, toSentenceCase(xls.source), xls.amount])
    } else {
      changed = true
      rows.push([makeId(), xls.year, xls.month, toSentenceCase(xls.source), xls.amount])
    }
  })

  dbIncRows.forEach(row => {
    if (!matchedIds.has(row[0])) { changed = true; rows.push(row) }
  })

  return { rows, changed }
}
