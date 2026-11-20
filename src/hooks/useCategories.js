import { useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId, uid } from '../api/session'
import { saveCategoryFS, saveAllCategoriesFS } from '../api/firestoreCategories'

export function useCategories({ loadAll, setDeleteConfirm, setCategories }) {
  const handleSaveCategory = useCallback(async (cat) => {
    const sid = getSheetId()
    if (!sid) { toast.error('Not signed in'); return }
    try {
      const category = { ...cat, id: cat.id || uid(), order: cat.order ?? 0 }
      await saveCategoryFS(sid, category)
      toast.success(cat.id ? 'Category updated!' : 'Category added!')
      loadAll()
    } catch (e) {
      toast.error(e.message); throw e
    }
  }, [loadAll])

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
    } catch (e) {
      toast.error('Reorder failed: ' + e.message)
      loadAll() // rollback on failure
    }
  }, [loadAll, setCategories])

  return { handleSaveCategory, handleDeleteCategory, handleReorderCategory }
}
