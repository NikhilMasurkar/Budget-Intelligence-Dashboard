import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  saveIncome, readAllIncomeRows, writeAllIncomeRows, getToken, uid
} from '../api/sheets'
import { toSentenceCase } from '../utils/constants'

export function useIncome({ loadAll, autoSyncToDrive, setDeleteConfirm, closeModal }) {
  const handleSaveIncome = useCallback(async (inc, applyMode = 'single') => {
    inc.source = toSentenceCase(inc.source)
    const targetYear = parseInt(inc.year)
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
        await saveIncome(inc, t)
        toast.success(inc.id ? 'Updated!' : 'Added!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(inc.month)
        const count = 12 - startMonth + 1
        toast.loading(`Saving to ${count} months...`, { id: 'multi-income' })
        const allRows = await readAllIncomeRows(t)
        for (let m = startMonth; m <= 12; m++) {
          const existIdx = allRows.findIndex(r =>
            toSentenceCase(r[3]) === toSentenceCase(inc.source) &&
            String(r[1]) === String(inc.year) && String(r[2]) === String(m)
          )
          const row = [
            existIdx >= 0 ? allRows[existIdx][0] : uid(),
            String(inc.year), String(m), inc.source, inc.amount
          ]
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }
        await writeAllIncomeRows(allRows, t)
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-income', duration: 3000 })
      }
      closeModal()
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message); throw e
    }
  }, [loadAll, autoSyncToDrive, closeModal])

  const handleDeleteIncome = useCallback((inc) => {
    setDeleteConfirm({ type: 'income', item: inc })
  }, [setDeleteConfirm])

  return { handleSaveIncome, handleDeleteIncome }
}
