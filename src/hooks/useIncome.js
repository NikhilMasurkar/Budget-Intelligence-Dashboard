import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { uid } from '../api/session'
import { saveIncome, readAllIncome, writeAllIncome } from '../api/store'
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
        const all = await readAllIncome()
        for (let m = startMonth; m <= 12; m++) {
          const hit = all.find(x => toSentenceCase(x.source) === inc.source &&
            String(x.year) === String(inc.year) && String(x.month) === String(m))
          // Shift the date onto the month being written — copying it verbatim
          // put a September date on the January entry.
          const item = { id: hit?.id || uid(), year: String(inc.year), month: String(m),
            source: inc.source, amount: inc.amount, date: dateForMonth(inc.date, m) }
          if (hit) Object.assign(hit, item)
          else all.push(item)
        }
        await writeAllIncome(all)
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
