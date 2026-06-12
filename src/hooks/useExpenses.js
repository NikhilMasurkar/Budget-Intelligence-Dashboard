import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  saveExpense, copyExpensesToNextMonth,
  readAllExpenseRows, writeAllExpenseRows, getToken, uid
} from '../api/sheets'

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
      if (applyMode === 'single') {
        await saveExpense(exp, t)
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
            exp.amount, exp.isFixed ? 'TRUE' : 'FALSE', exp.note || ''
          ]
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }
        await writeAllExpenseRows(allRows, t)
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
    try {
      if (scope === 'month') {
        const updated = { ...expense }
        if (field === 'isFixed') updated.isFixed = value ? 'TRUE' : 'FALSE'
        else updated[field] = value
        await saveExpense(updated, t)
        toast.success('Updated!')
      } else {
        toast.loading('Updating across all months...', { id: 'field-update' })
        const allRows = await readAllExpenseRows(t)
        const fieldIdx = { itemName: 4, categoryId: 3, amount: 5, isFixed: 6, note: 7 }
        const idx = fieldIdx[field]
        let count = 0
        for (let i = 0; i < allRows.length; i++) {
          if (toSentenceCase(allRows[i][4]) === toSentenceCase(expense.itemName) &&
            allRows[i][3] === expense.categoryId &&
            String(allRows[i][1]) === String(expense.year)) {
            allRows[i][idx] = field === 'isFixed' ? (value ? 'TRUE' : 'FALSE') : value
            count++
          }
        }
        await writeAllExpenseRows(allRows, t)
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

  return { handleSaveExpense, handleFieldUpdate, handleDeleteExpense, handleCopySelected }
}
