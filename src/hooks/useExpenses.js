import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { uid } from '../api/session'
import { saveExpense, copyExpensesToNextMonth, readAllExpenseRows, writeAllExpenseRows } from '../api/store'
import { MONTHS, toSentenceCase, isYearLocked } from '../utils/constants'
import { mergeSameItem } from '../utils/money'

const LOCKED = 'Cannot modify historical data: Year is locked.'

export function useExpenses({ loadAll, year, month, setDeleteConfirm, closeModal, clearSelection }) {
  const handleSaveExpense = useCallback(async (exp, applyMode = 'single') => {
    // 'split' — one withdrawal spread across several investments, so each pot's
    // balance drops by its own share. Written in one batch.
    if (applyMode === 'split') {
      const rows = Array.isArray(exp) ? exp : [exp]
      if (!rows.length) return
      if (isYearLocked(parseInt(rows[0].year || year))) { toast.error(LOCKED); return }
      try {
        const allRows = await readAllExpenseRows()
        // Splitting an EXISTING withdrawal replaces it — drop the original first.
        const editingId = rows[0]?.id
        const kept = editingId ? allRows.filter(r => r[0] !== editingId) : allRows
        rows.forEach(r => kept.push([uid(), String(r.year), String(r.month), r.categoryId,
          toSentenceCase(r.itemName), r.amount, 'FALSE', r.note || '', 'U' + Date.now()]))
        await writeAllExpenseRows(kept)
        toast.success(`${editingId ? 'Split across' : 'Withdrawn from'} ${rows.length} investments`)
        closeModal()
        loadAll()
      } catch (e) { toast.error(e.message); throw e }
      return
    }

    exp.itemName = toSentenceCase(exp.itemName)
    if (isYearLocked(parseInt(exp.year || year))) { toast.error(LOCKED); return }
    const isNew = !exp.id
    try {
      if (applyMode === 'single') {
        // Same item already in this month + category → add to it, not a duplicate.
        const merged = isNew ? mergeSameItem(await readAllExpenseRows(), exp) : null
        await saveExpense(merged || exp)
        toast.success(merged
          ? `Added ₹${Math.abs(merged.added).toLocaleString('en-IN')} to ${merged.itemName} — now ₹${Math.abs(merged.amount).toLocaleString('en-IN')}`
          : isNew ? 'Added!' : 'Updated!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(exp.month)
        const count = 12 - startMonth + 1
        toast.loading(`Saving to ${count} months...`, { id: 'multi-exp' })
        const allRows = await readAllExpenseRows()
        for (let m = startMonth; m <= 12; m++) {
          const existIdx = allRows.findIndex(r =>
            toSentenceCase(r[4]) === exp.itemName && r[3] === exp.categoryId &&
            String(r[1]) === String(exp.year) && String(r[2]) === String(m))
          const row = [existIdx >= 0 ? allRows[existIdx][0] : uid(), String(exp.year), String(m),
            exp.categoryId, exp.itemName, exp.amount, exp.isFixed ? 'TRUE' : 'FALSE', exp.note || '', 'U' + Date.now()]
          if (existIdx >= 0) allRows[existIdx] = Object.assign(allRows[existIdx], row)
          else allRows.push(row)
        }
        await writeAllExpenseRows(allRows)
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-exp', duration: 3000 })
      }
      closeModal()
      loadAll()
    } catch (e) { toast.error(e.message, { id: 'multi-exp' }); throw e }
  }, [year, loadAll, closeModal])

  const handleDeleteExpense = useCallback((exp) => {
    setDeleteConfirm({ type: 'expense', item: exp })
  }, [setDeleteConfirm])

  const handleCopySelected = useCallback(async (selectedIds) => {
    if (!selectedIds.length) { toast.error('No expenses selected'); return }
    if (isYearLocked(year)) { toast.error(LOCKED); return }
    try {
      toast.loading('Copying selected expenses...', { id: 'copy-selected' })
      const r = await copyExpensesToNextMonth(year, month, selectedIds)
      toast.success(`Copied ${r.copied} expenses to ${MONTHS[r.toMonth - 1]} ${r.toYear}`, { id: 'copy-selected' })
      clearSelection()
      loadAll()
    } catch (e) { toast.error(e.message, { id: 'copy-selected' }) }
  }, [year, month, loadAll, clearSelection])

  // Change many rows in one write: `edit(row)` returns true when it changed it.
  const bulk = useCallback(async (selected, id, busyMsg, edit, doneMsg) => {
    if (!selected?.length) { toast.error('No expenses selected'); return }
    if (isYearLocked(year)) { toast.error(LOCKED); return }
    try {
      toast.loading(busyMsg, { id })
      const ids = new Set(selected.map(e => e.id))
      const rows = await readAllExpenseRows()
      const kept = edit ? rows : rows.filter(r => !ids.has(r[0]))
      let changed = selected.length
      if (edit) { changed = 0; rows.forEach(r => { if (ids.has(r[0]) && edit(r)) changed++ }) }
      await writeAllExpenseRows(kept)
      toast.success(doneMsg(changed), { id, duration: 3000 })
      clearSelection()
      loadAll()
    } catch (e) { toast.error(e.message, { id }) }
  }, [year, loadAll, clearSelection])

  const s = (n) => `${n} expense${n !== 1 ? 's' : ''}`
  const handleBulkPin = useCallback((selected, pinned) => bulk(selected, 'bulk-pin',
    `${pinned ? 'Pinning' : 'Unpinning'} ${s(selected?.length || 0)}…`,
    r => { r[6] = pinned ? 'TRUE' : 'FALSE'; r[8] = 'U' + Date.now(); return true },
    n => `${pinned ? '📌 Pinned' : 'Unpinned'} ${s(n)}!`), [bulk])
  const handleBulkDelete = useCallback((selected) => bulk(selected, 'bulk-del',
    `Deleting ${s(selected?.length || 0)}…`, null, n => `Deleted ${s(n)}!`), [bulk])

  // Save an expense's comment thread (a JSON array in its note).
  const handleSaveComment = useCallback(async (expense, noteJson) => {
    const fail = (msg) => { toast.error(msg); throw new Error(msg) }
    if (isYearLocked(expense.year || year)) fail(LOCKED)
    try {
      const rows = await readAllExpenseRows()
      const row = rows.find(r => r[0] === expense.id)
      if (!row) throw new Error('This expense was changed elsewhere — refresh and try again')
      row[7] = noteJson
      row[8] = 'U' + Date.now()
      await writeAllExpenseRows(rows)
      loadAll()
    } catch (e) {
      // Rethrow so the comments box keeps the typed text.
      toast.error(e.message); throw e
    }
  }, [year, loadAll])

  return { handleSaveExpense, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment }
}
