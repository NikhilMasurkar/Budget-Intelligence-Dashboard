import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { uid } from '../api/session'
import { saveExpense, copyExpensesToNextMonth, readAllExpenses, writeAllExpenses } from '../api/store'
import { MONTHS, toSentenceCase, isYearLocked } from '../utils/constants'
import { mergeSameItem } from '../utils/money'

const LOCKED = 'Cannot modify historical data: Year is locked.'
const stamp = () => 'U' + Date.now()
const plural = (n) => `${n} expense${n !== 1 ? 's' : ''}`

export function useExpenses({ loadAll, year, month, setDeleteConfirm, closeModal, clearSelection }) {
  const handleSaveExpense = useCallback(async (exp, applyMode = 'single') => {
    // 'split' — one withdrawal spread across several investments, so each pot's
    // balance drops by its own share. Written in one batch.
    if (applyMode === 'split') {
      const parts = Array.isArray(exp) ? exp : [exp]
      if (!parts.length) return
      if (isYearLocked(parseInt(parts[0].year || year))) { toast.error(LOCKED); return }
      try {
        const all = await readAllExpenses()
        // Splitting an EXISTING withdrawal replaces it — drop the original first.
        const editingId = parts[0]?.id
        const kept = editingId ? all.filter(x => x.id !== editingId) : all
        parts.forEach(p => kept.push({ id: uid(), year: String(p.year), month: String(p.month), categoryId: p.categoryId,
          itemName: toSentenceCase(p.itemName), amount: p.amount, isFixed: false, note: p.note || '', updatedAt: stamp() }))
        await writeAllExpenses(kept)
        toast.success(`${editingId ? 'Split across' : 'Withdrawn from'} ${parts.length} investments`)
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
        const merged = isNew ? mergeSameItem(await readAllExpenses(), exp) : null
        await saveExpense(merged || exp)
        toast.success(merged
          ? `Added ₹${Math.abs(merged.added).toLocaleString('en-IN')} to ${merged.itemName} — now ₹${Math.abs(merged.amount).toLocaleString('en-IN')}`
          : isNew ? 'Added!' : 'Updated!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(exp.month)
        const count = 12 - startMonth + 1
        toast.loading(`Saving to ${count} months...`, { id: 'multi-exp' })
        const all = await readAllExpenses()
        for (let m = startMonth; m <= 12; m++) {
          const hit = all.find(x => toSentenceCase(x.itemName) === exp.itemName && x.categoryId === exp.categoryId &&
            String(x.year) === String(exp.year) && String(x.month) === String(m))
          const item = { id: hit?.id || uid(), year: String(exp.year), month: String(m), categoryId: exp.categoryId,
            itemName: exp.itemName, amount: exp.amount, isFixed: !!exp.isFixed, note: exp.note || '', updatedAt: stamp() }
          if (hit) Object.assign(hit, item)
          else all.push(item)
        }
        await writeAllExpenses(all)
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

  // Change many expenses in one write. `edit(item)` changes one in place; with
  // no edit, the selected ones are deleted.
  const bulk = useCallback(async (selected, id, busyMsg, edit, doneMsg) => {
    if (!selected?.length) { toast.error('No expenses selected'); return }
    if (isYearLocked(year)) { toast.error(LOCKED); return }
    try {
      toast.loading(busyMsg, { id })
      const ids = new Set(selected.map(e => e.id))
      const all = await readAllExpenses()
      const hits = all.filter(x => ids.has(x.id))
      if (edit) hits.forEach(edit)
      await writeAllExpenses(edit ? all : all.filter(x => !ids.has(x.id)))
      toast.success(doneMsg(edit ? hits.length : selected.length), { id, duration: 3000 })
      clearSelection()
      loadAll()
    } catch (e) { toast.error(e.message, { id }) }
  }, [year, loadAll, clearSelection])

  const handleBulkPin = useCallback((selected, pinned) => bulk(selected, 'bulk-pin',
    `${pinned ? 'Pinning' : 'Unpinning'} ${plural(selected?.length || 0)}…`,
    x => { x.isFixed = pinned; x.updatedAt = stamp() },
    n => `${pinned ? '📌 Pinned' : 'Unpinned'} ${plural(n)}!`), [bulk])
  const handleBulkDelete = useCallback((selected) => bulk(selected, 'bulk-del',
    `Deleting ${plural(selected?.length || 0)}…`, null, n => `Deleted ${plural(n)}!`), [bulk])

  // Save an expense's comment thread (a JSON array in its note).
  const handleSaveComment = useCallback(async (expense, noteJson) => {
    const fail = (msg) => { toast.error(msg); throw new Error(msg) }
    if (isYearLocked(expense.year || year)) fail(LOCKED)
    try {
      const all = await readAllExpenses()
      const hit = all.find(x => x.id === expense.id)
      if (!hit) throw new Error('This expense was changed elsewhere — refresh and try again')
      hit.note = noteJson
      hit.updatedAt = stamp()
      await writeAllExpenses(all)
      loadAll()
    } catch (e) {
      // Rethrow so the comments box keeps the typed text.
      toast.error(e.message); throw e
    }
  }, [year, loadAll])

  return { handleSaveExpense, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment }
}
