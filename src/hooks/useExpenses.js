import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  saveExpense, copyExpensesToNextMonth,
  readAllExpenseRows, writeAllExpenseRows, getToken, getSheetId, uid
} from '../api/sheets'
import { setExpenseMetaFS } from '../api/firestoreExpenseMeta'

import { MONTHS, toSentenceCase } from '../utils/constants'

export function useExpenses({ loadAll, autoSyncToDrive, year, month, setDeleteConfirm, closeModal, clearSelection }) {
  const handleSaveExpense = useCallback(async (exp, applyMode = 'single') => {
    exp.itemName = toSentenceCase(exp.itemName)
    const targetYear = parseInt(exp.year || year)
    if (targetYear < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) {
      const err = new Error('Please sign in to save changes')
      toast.error(err.message); throw err
    }
    try {
      const sid = getSheetId()
      if (applyMode === 'single') {
        await saveExpense(exp, t)
        // Persist pin + note to Firestore (survives the Excel round-trip)
        await setExpenseMetaFS(sid, exp, { isFixed: exp.isFixed, note: exp.note })
        toast.success(exp.id ? 'Updated!' : 'Added!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(exp.month)
        const count = 12 - startMonth + 1
        toast.loading(`Saving to ${count} months...`, { id: 'multi-exp' })
        const allRows = await readAllExpenseRows(t)
        for (let m = startMonth; m <= 12; m++) {
          const existIdx = allRows.findIndex(r =>
            toSentenceCase(r[4]) === toSentenceCase(exp.itemName) &&
            r[3] === exp.categoryId && String(r[1]) === String(exp.year) && String(r[2]) === String(m)
          )
          const row = [
            existIdx >= 0 ? allRows[existIdx][0] : uid(),
            String(exp.year), String(m), exp.categoryId, exp.itemName,
            exp.amount, exp.isFixed ? 'TRUE' : 'FALSE', exp.note || '',
            'U' + Date.now()
          ]
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }
        await writeAllExpenseRows(allRows, t)
        // Persist pin + note to Firestore for every month it was applied to
        await Promise.all(
          Array.from({ length: count }, (_, k) => startMonth + k).map(m =>
            setExpenseMetaFS(sid, { year: exp.year, month: m, categoryId: exp.categoryId, itemName: exp.itemName }, { isFixed: exp.isFixed, note: exp.note })
          )
        )
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-exp', duration: 3000 })
      }
      closeModal()
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message); throw e
    }
  }, [year, loadAll, autoSyncToDrive, closeModal])

  const handleFieldUpdate = useCallback(async (expense, field, value, scope) => {
    if (field === 'itemName') value = toSentenceCase(value)
    const targetYear = parseInt(expense.year || year)
    if (targetYear < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    const sid = getSheetId()
    try {
      // isFixed and note are app-only fields mirrored to Firestore
      const metaFor = (v) => field === 'isFixed' ? { isFixed: v } : field === 'note' ? { note: v } : null
      if (scope === 'month') {
        const updated = { ...expense }
        if (field === 'isFixed') updated.isFixed = value ? 'TRUE' : 'FALSE'
        else updated[field] = value
        await saveExpense(updated, t)
        const meta = metaFor(value)
        if (meta) await setExpenseMetaFS(sid, updated, meta)
        toast.success('Updated!')
      } else {
        toast.loading('Updating across all months...', { id: 'field-update' })
        const allRows = await readAllExpenseRows(t)
        const fieldIdx = { itemName: 4, categoryId: 3, amount: 5, isFixed: 6, note: 7 }
        const idx = fieldIdx[field]
        let count = 0
        const touchedMonths = []
        for (let i = 0; i < allRows.length; i++) {
          if (toSentenceCase(allRows[i][4]) === toSentenceCase(expense.itemName) &&
            allRows[i][3] === expense.categoryId &&
            String(allRows[i][1]) === String(expense.year)) {
            allRows[i][idx] = field === 'isFixed' ? (value ? 'TRUE' : 'FALSE') : value
            allRows[i][8] = 'U' + Date.now()
            touchedMonths.push(allRows[i][2])
            count++
          }
        }
        await writeAllExpenseRows(allRows, t)
        const meta = metaFor(value)
        if (meta) {
          await Promise.all(touchedMonths.map(m =>
            setExpenseMetaFS(sid, { year: expense.year, month: m, categoryId: expense.categoryId, itemName: expense.itemName }, meta)
          ))
        }
        toast.success(`Updated in ${count} months!`, { id: 'field-update' })
      }
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message) }
  }, [year, loadAll, autoSyncToDrive])

  const handleDeleteExpense = useCallback((exp) => {
    setDeleteConfirm({ type: 'expense', item: exp })
  }, [setDeleteConfirm])

  const handleCopySelected = useCallback(async (selectedIds) => {
    if (!selectedIds.length) { toast.error('No expenses selected'); return }
    if (parseInt(year) < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try {
      toast.loading('Copying selected expenses...', { id: 'copy-selected' })
      const r = await copyExpensesToNextMonth(year, month, selectedIds, t)
      toast.success(`Copied ${r.copied} expenses to ${MONTHS[r.toMonth - 1]} ${r.toYear}`, { id: 'copy-selected' })
      clearSelection()
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message, { id: 'copy-selected' }) }
  }, [year, month, loadAll, autoSyncToDrive, clearSelection])

  // Pin / unpin many expenses at once. `selected` is an array of expense
  // objects (need id + year/month/categoryId/itemName). One Sheet write,
  // then batched Firestore writes — far faster than editing each one.
  const handleBulkPin = useCallback(async (selected, pinned) => {
    if (!selected?.length) { toast.error('No expenses selected'); return }
    if (parseInt(year) < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    const sid = getSheetId()
    const verb = pinned ? 'Pinning' : 'Unpinning'
    try {
      toast.loading(`${verb} ${selected.length} expense${selected.length !== 1 ? 's' : ''}…`, { id: 'bulk-pin' })
      const idSet = new Set(selected.map(e => e.id))
      const allRows = await readAllExpenseRows(t)
      let changed = 0
      for (let i = 0; i < allRows.length; i++) {
        if (idSet.has(allRows[i][0])) {
          allRows[i][6] = pinned ? 'TRUE' : 'FALSE'
          allRows[i][8] = 'U' + Date.now()
          changed++
        }
      }
      await writeAllExpenseRows(allRows, t)
      // Mirror to Firestore so the pin survives the Excel round-trip
      await Promise.all(selected.map(e => setExpenseMetaFS(sid, e, { isFixed: pinned })))
      toast.success(`${pinned ? '📌 Pinned' : 'Unpinned'} ${changed} expense${changed !== 1 ? 's' : ''}!`, { id: 'bulk-pin', duration: 3000 })
      clearSelection()
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message, { id: 'bulk-pin' }) }
  }, [year, loadAll, autoSyncToDrive, clearSelection])

  // Delete many expenses at once. `selected` is an array of expense objects.
  // One Sheet write (read → filter out selected ids → write back).
  const handleBulkDelete = useCallback(async (selected) => {
    if (!selected?.length) { toast.error('No expenses selected'); return }
    if (parseInt(year) < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try {
      toast.loading(`Deleting ${selected.length} expense${selected.length !== 1 ? 's' : ''}…`, { id: 'bulk-del' })
      const idSet = new Set(selected.map(e => e.id))
      const allRows = await readAllExpenseRows(t)
      const filtered = allRows.filter(r => !idSet.has(r[0]))
      await writeAllExpenseRows(filtered, t)
      toast.success(`Deleted ${selected.length} expense${selected.length !== 1 ? 's' : ''}!`, { id: 'bulk-del', duration: 3000 })
      clearSelection()
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message, { id: 'bulk-del' }) }
  }, [year, loadAll, autoSyncToDrive, clearSelection])

  // Append a new comment to an expense's note (stored as JSON array in Sheet + Firestore).
  const handleSaveComment = useCallback(async (expense, noteJson) => {
    if (parseInt(expense.year || year) < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    const sid = getSheetId()
    try {
      const allRows = await readAllExpenseRows(t)
      const idx = allRows.findIndex(r => r[0] === expense.id)
      if (idx >= 0) {
        allRows[idx][7] = noteJson
        allRows[idx][8] = 'U' + Date.now()
        await writeAllExpenseRows(allRows, t)
      }
      await setExpenseMetaFS(sid, expense, { note: noteJson })
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message) }
  }, [year, loadAll, autoSyncToDrive])

  return { handleSaveExpense, handleFieldUpdate, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment }
}
