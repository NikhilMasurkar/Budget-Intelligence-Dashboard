import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { saveCategory, reorderCategories, getToken } from '../api/sheets'

export function useCategories({ loadAll, autoSyncToDrive, setDeleteConfirm, setCategories }) {
  const handleSaveCategory = useCallback(async (cat) => {
    const t = getToken()
    if (!t) {
      const err = new Error('Sign in required')
      toast.error(err.message); throw err
    }
    try {
      await saveCategory(cat, t)
      toast.success('Saved!')
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message); throw e
    }
  }, [loadAll, autoSyncToDrive])

  const handleDeleteCategory = useCallback((cat) => {
    setDeleteConfirm({ type: 'category', item: cat })
  }, [setDeleteConfirm])

  const handleReorderCategory = useCallback(async (orderedCats) => {
    const t = getToken()
    if (!t) return
    setCategories(orderedCats)
    try {
      await reorderCategories(orderedCats, t)
      toast.success('Category order saved!')
      autoSyncToDrive()
    } catch (e) {
      toast.error('Reorder failed: ' + e.message)
      loadAll({ skipExcel: true })
    }
  }, [loadAll, autoSyncToDrive, setCategories])

  return { handleSaveCategory, handleDeleteCategory, handleReorderCategory }
}
