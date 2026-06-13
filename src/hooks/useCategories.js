import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId, uid } from '../api/sheets'
import { saveCategoryFS, saveAllCategoriesFS } from '../api/firestoreCategories'

export function useCategories({ loadAll, autoSyncToDrive, setDeleteConfirm, setCategories }) {
  const handleSaveCategory = useCallback(async (cat) => {
    const sid = getSheetId()
    if (!sid) { toast.error('No sheet connected'); return }
    try {
      const category = { ...cat, id: cat.id || uid(), order: cat.order ?? 0 }
      await saveCategoryFS(sid, category)
      toast.success(cat.id ? 'Category updated!' : 'Category added!')
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
    const sid = getSheetId()
    if (!sid) return
    setCategories(orderedCats) // optimistic update
    try {
      await saveAllCategoriesFS(sid, orderedCats)
      toast.success('Order saved!')
      autoSyncToDrive()
    } catch (e) {
      toast.error('Reorder failed: ' + e.message)
      loadAll({ skipExcel: true }) // rollback on failure
    }
  }, [loadAll, autoSyncToDrive, setCategories])

  return { handleSaveCategory, handleDeleteCategory, handleReorderCategory }
}
