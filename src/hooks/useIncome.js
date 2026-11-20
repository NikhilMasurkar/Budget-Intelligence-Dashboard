import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { uid } from '../api/session'
import { saveIncome, readAllIncomeRows, writeAllIncomeRows } from '../api/store'
import { toSentenceCase, dateForMonth, isYearLocked } from '../utils/constants'

export function useIncome({ loadAll, setDeleteConfirm, closeModal }) {
  const handleSaveIncome = useCallback(async (inc, applyMode = 'single') => {
    inc.source = toSentenceCase(inc.source)
    const targetYear = parseInt(inc.year)
    if (isYearLocked(targetYear)) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    try {
      if (applyMode === 'single') {
        await saveIncome(inc)
        toast.success(inc.id ? 'Updated!' : 'Added!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(inc.month)
        const count = 12 - startMonth + 1
        toast.loading(`Saving to ${count} months...`, { id: 'multi-income' })
        const allRows = await readAllIncomeRows()
        for (let m = startMonth; m <= 12; m++) {
          const existIdx = allRows.findIndex(r =>
            toSentenceCase(r[3]) === toSentenceCase(inc.source) &&
            String(r[1]) === String(inc.year) && String(r[2]) === String(m)
          )
          const row = [
            existIdx >= 0 ? allRows[existIdx][0] : uid(),
            // Shift the date onto the month being written — copying it verbatim
            // put a September date on the January row.
            String(inc.year), String(m), inc.source, inc.amount, dateForMonth(inc.date, m)
          ]
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }
        await writeAllIncomeRows(allRows)
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-income', duration: 3000 })
      }
      closeModal()
      loadAll()
    } catch (e) {
      toast.error(e.message); throw e
    }
  }, [loadAll, closeModal])

  const handleDeleteIncome = useCallback((inc) => {
    setDeleteConfirm({ type: 'income', item: inc })
  }, [setDeleteConfirm])

  return { handleSaveIncome, handleDeleteIncome }
}
