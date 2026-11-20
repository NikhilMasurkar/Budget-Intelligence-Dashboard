import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId, DEFAULT_CATEGORIES } from '../api/session'
import { fetchExpenses, fetchIncome, autoFixedCopyToMonth } from '../api/store'
import { fetchCategoriesFS, saveAllCategoriesFS } from '../api/firestoreCategories'
import { YEAR_NOW, toSentenceCase } from '../utils/constants'

// Every year present in the data, plus the current one; future years only if
// something is already entered there.
export function yearsIn(exps, inc, systemYear = new Date().getFullYear()) {
  const years = new Set([systemYear])
  for (const r of [...exps, ...inc]) { const y = parseInt(r.year, 10); if (Number.isFinite(y)) years.add(y) }
  return [...years].sort((a, b) => a - b)
}

export function useBudgetData({ authd, onUnauthorized }) {
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(false)
  const [availableYears, setAvailableYears] = useState([YEAR_NOW])
  const [didInitialLoad, setDidInitialLoad] = useState(false)

  const missingConfig = !import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || !import.meta.env.VITE_FIREBASE_PROJECT_ID

  const loadAll = useCallback(async () => {
    const sid = getSheetId()
    if (missingConfig || !authd || !sid) { setCategories([]); setExpenses([]); setIncome([]); return }
    setLoading(true)
    try {
      let cats = await fetchCategoriesFS(sid)
      if (cats.length === 0) {   // brand-new account
        cats = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }))
        await saveAllCategoriesFS(sid, cats)
      }
      const [rawExps, rawInc] = await Promise.all([fetchExpenses(), fetchIncome()])
      const exps = rawExps.map(e => ({ ...e, itemName: toSentenceCase(e.itemName) }))
      const inc = rawInc.map(i => ({ ...i, source: toSentenceCase(i.source) }))
      setCategories(cats)
      setExpenses(exps)
      setIncome(inc)
      setAvailableYears(yearsIn(exps, inc))
    } catch (e) {
      if (e?.code === 'permission-denied') {
        toast.error('Access denied. Signing out…', { duration: 5000 })
        onUnauthorized?.()
      } else if (e?.code === 'unavailable') {
        toast.error("You're offline and this phone has no saved copy yet. Connect once to load your data.")
      } else {
        toast.error('Load failed: ' + e.message)
      }
    } finally {
      setLoading(false)
      setDidInitialLoad(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onUnauthorized is a new function every App render; listing it would reload endlessly
  }, [missingConfig, authd])

  useEffect(() => { loadAll() }, [loadAll])

  // Copy pinned expenses into the new month, once per calendar month.
  useEffect(() => {
    if (!authd || !didInitialLoad) return
    const now = new Date()
    const curY = now.getFullYear(), curM = now.getMonth() + 1
    const key = `budgetiq_autocopy_${curY}_${curM}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    autoFixedCopyToMonth(curY, curM)
      .then(count => {
        if (!count) return
        toast.success(`📌 Auto-copied ${count} recurring expense${count > 1 ? 's' : ''} from last month`, { duration: 4000 })
        loadAll()
      })
      .catch(e => { localStorage.removeItem(key); console.error('[AutoFixed]', e) })
  }, [authd, didInitialLoad]) // eslint-disable-line react-hooks/exhaustive-deps

  return { categories, expenses, income, loading, didInitialLoad, availableYears, loadAll, setCategories, missingConfig }
}
