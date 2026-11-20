import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId } from '../api/session'
import {
  deleteExpense, deleteIncome, readAllExpenses, writeAllExpenses,
  readAllIncome, writeAllIncome,
} from '../api/store'
import { deleteCategoryFS } from '../api/firestoreCategories'
import { toSentenceCase, isYearLocked } from '../utils/constants'

const sameYear = (a, b) => String(a.year) === String(b.year)

// The "are you sure?" delete: what is pending, and the delete itself —
// this month only, or the same item across every month of its year.
export function useDeleteConfirm({ year, loadAll }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const executeDelete = async (scope) => {
    const { type, item } = deleteConfirm
    const targetYear = parseInt(item?.year || year)
    if (type !== 'category' && targetYear && isYearLocked(targetYear)) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    try {
      if (type === 'category') {
        await deleteCategoryFS(getSheetId(), item.id)
        toast.success('Deleted')
      } else if (scope === 'month') {
        await (type === 'expense' ? deleteExpense : deleteIncome)(item.id)
        toast.success('Deleted from this month')
      } else {
        toast.loading('Deleting from all months...', { id: 'del-all' })
        if (type === 'expense') {
          const all = await readAllExpenses()
          await writeAllExpenses(all.filter(x => !(sameYear(x, item) && x.categoryId === item.categoryId &&
            toSentenceCase(x.itemName) === toSentenceCase(item.itemName))))
        } else {
          const all = await readAllIncome()
          await writeAllIncome(all.filter(x => !(sameYear(x, item) &&
            toSentenceCase(x.source) === toSentenceCase(item.source))))
        }
        toast.success('Deleted from all months!', { id: 'del-all' })
      }
      setDeleteConfirm(null)
      loadAll()
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  return { deleteConfirm, setDeleteConfirm, executeDelete }
}
