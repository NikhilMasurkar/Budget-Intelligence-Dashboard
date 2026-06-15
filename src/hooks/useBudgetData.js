import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  fetchCategories, fetchExpenses, fetchIncome,
  getToken, getSheetId, signOut,
  DEFAULT_CATEGORIES, downloadExcelFromDrive,
  readAllExpenseRows, writeAllExpenseRows,
  readAllIncomeRows, writeAllIncomeRows,
  uploadExcelToDrive, uid, autoFixedCopyToMonth
} from '../api/sheets'
import {
  fetchCategoriesFS, saveAllCategoriesFS
} from '../api/firestoreCategories'
import { YEAR_NOW, toSentenceCase } from '../utils/constants'

export function useBudgetData({ authd, userName, onUnauthorized }) {
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [availableYears, setAvailableYears] = useState([YEAR_NOW])

  const missingConfig = !import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ||
    !import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    !import.meta.env.VITE_FIREBASE_PROJECT_ID

  const loadAll = useCallback(async (opts = {}) => {
    if (missingConfig) return
    const t = getToken()
    const sid = getSheetId()
    if (!t || !sid) { setCategories([]); setExpenses([]); setIncome([]); return }
    setLoading(true)
    setNeedsSetup(false)
    try {
      // ── Categories: Firestore is the source of truth ──────────────────────
      let cats = await fetchCategoriesFS(sid)

      if (cats.length === 0) {
        // One-time migration: pull from the Google Sheet Categories tab
        const sheetCats = await fetchCategories(t)
        if (sheetCats.length > 0) {
          const withOrder = sheetCats.map((c, i) => ({ ...c, order: i }))
          await saveAllCategoriesFS(sid, withOrder)
          cats = withOrder
          toast.success('Categories migrated to Firebase ✓', { duration: 3000 })
        } else {
          // Brand-new user: seed default categories into Firestore
          const withOrder = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i }))
          await saveAllCategoriesFS(sid, withOrder)
          cats = withOrder
        }
      }

      setCategories(cats)

      // ── Expenses + Income: Google Sheets (unchanged) ──────────────────────
      let xlsxExps = [], xlsxInc = [], xlsxOk = false
      if (!opts.skipExcel) {
        try {
          const buffer = await downloadExcelFromDrive(t, userName)
          if (buffer) {
            const { importFromExcel } = await import('../utils/parseExcel')
            const parsed = await importFromExcel(buffer, cats)
            xlsxExps = parsed.expenses
            xlsxInc = parsed.income
            xlsxOk = true
          } else {
            console.warn('[BudgetIQ] balance_sheet_.xlsx not found on Drive — using Sheets DB')
          }
        } catch (driveErr) {
          console.warn('[BudgetIQ] Drive Excel error:', driveErr.message)
        }
      }

      let rawExps = [], rawInc = []

      if (xlsxOk) {
        const [dbExpRows, dbIncRows] = await Promise.all([
          readAllExpenseRows(t),
          readAllIncomeRows(t)
        ])

        const reconciledExpenses = []
        const dbExpMap = new Map()
        dbExpRows.forEach(row => {
          const key = `${row[1]}-${row[2]}-${row[3]}-${toSentenceCase(row[4])}`
          dbExpMap.set(key, row)
        })

        let expensesChanged = false
        xlsxExps.forEach(xls => {
          const key = `${xls.year}-${xls.month}-${xls.categoryId}-${toSentenceCase(xls.itemName)}`
          const existing = dbExpMap.get(key)
          if (existing) {
            xls.id = existing[0]
            const amountDiff = String(existing[5]) !== String(xls.amount)
            const fixedDiff = String(existing[6]) !== String(xls.isFixed || 'FALSE')
            if (amountDiff || fixedDiff) expensesChanged = true
            reconciledExpenses.push([
              existing[0], xls.year, xls.month, xls.categoryId,
              toSentenceCase(xls.itemName), xls.amount,
              // Sheets DB wins for isFixed — app pins must not be overwritten by stale Excel
              existing[6] || xls.isFixed || 'FALSE', existing[7] || ''
            ])
            dbExpMap.delete(key)
          } else {
            if (!xls.id) xls.id = uid()
            expensesChanged = true
            reconciledExpenses.push([
              xls.id, xls.year, xls.month, xls.categoryId,
              toSentenceCase(xls.itemName), xls.amount, xls.isFixed || 'FALSE', ''
            ])
          }
        })
        // Preserve Sheets-only rows (added in app, not yet in Drive Excel backup)
        dbExpMap.forEach(row => { expensesChanged = true; reconciledExpenses.push(row) })
        if (expensesChanged) await writeAllExpenseRows(reconciledExpenses, t)

        const reconciledIncome = []
        const dbIncMap = new Map()
        dbIncRows.forEach(row => {
          const key = `${row[1]}-${row[2]}-${toSentenceCase(row[3])}`
          dbIncMap.set(key, row)
        })

        let incomeChanged = false
        xlsxInc.forEach(xls => {
          const key = `${xls.year}-${xls.month}-${toSentenceCase(xls.source)}`
          const existing = dbIncMap.get(key)
          if (existing) {
            xls.id = existing[0]
            if (String(existing[4]) !== String(xls.amount)) incomeChanged = true
            reconciledIncome.push([
              existing[0], xls.year, xls.month, toSentenceCase(xls.source), xls.amount
            ])
            dbIncMap.delete(key)
          } else {
            if (!xls.id) xls.id = uid()
            incomeChanged = true
            reconciledIncome.push([xls.id, xls.year, xls.month, toSentenceCase(xls.source), xls.amount])
          }
        })
        // Preserve Sheets-only income rows (added in app, not yet in Drive Excel backup)
        dbIncMap.forEach(row => { incomeChanged = true; reconciledIncome.push(row) })
        if (incomeChanged) await writeAllIncomeRows(reconciledIncome, t)

        rawExps = reconciledExpenses.map(r => ({
          id: r[0], year: r[1], month: r[2], categoryId: r[3],
          itemName: r[4], amount: r[5], isFixed: r[6], note: r[7]
        }))
        rawInc = reconciledIncome.map(r => ({
          id: r[0], year: r[1], month: r[2], source: r[3], amount: r[4]
        }))
      } else {
        rawExps = await fetchExpenses(null, t)
        rawInc = await fetchIncome(null, t)
      }

      const exps = rawExps.map(e => ({ ...e, itemName: toSentenceCase(e.itemName) }))
      const inc = rawInc.map(i => ({ ...i, source: toSentenceCase(i.source) }))

      setExpenses(exps)
      setIncome(inc)

      const systemYear = new Date().getFullYear()
      const years = new Set([systemYear])
      exps.forEach(e => { if (e.year) years.add(parseInt(e.year)) })
      inc.forEach(i => { if (i.year) years.add(parseInt(i.year)) })
      const filteredYears = Array.from(years)
        .filter(y => y <= systemYear || exps.some(e => parseInt(e.year) === y) || inc.some(i => parseInt(i.year) === y))
        .sort((a, b) => a - b)
      setAvailableYears(filteredYears)

    } catch (e) {
      if (e.message.includes('Unable to parse range')) {
        setNeedsSetup(true)
      } else if (e.message.includes('The caller does not have permission')) {
        toast.error('Access Denied. Signing out...', { duration: 5000 })
        signOut()
        setCategories([]); setExpenses([]); setIncome([])
        onUnauthorized?.()
      } else {
        toast.error('Load failed: ' + e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [missingConfig, userName, authd])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!authd) return
    const t = getToken()
    if (!t) return
    async function scanYears() {
      try {
        const [allExp, allInc] = await Promise.all([
          fetchExpenses(null, t),
          fetchIncome(null, t)
        ])
        const extraYears = new Set()
        allExp.forEach(e => { if (e.year) extraYears.add(parseInt(e.year)) })
        allInc.forEach(i => { if (i.year) extraYears.add(parseInt(i.year)) })
        setAvailableYears(prev => {
          const merged = new Set([...prev, ...extraYears])
          const sorted = Array.from(merged).sort((a, b) => a - b)
          if (sorted.length === prev.length && sorted.every((y, i) => y === prev[i])) return prev
          return sorted
        })
      } catch (e) {
        console.error('Year scan failed:', e)
      }
    }
    scanYears()
  }, [authd])

  // Auto-copy fixed expenses once per calendar month
  useEffect(() => {
    if (!authd) return
    const t = getToken()
    if (!t) return
    const now = new Date()
    const curY = now.getFullYear()
    const curM = now.getMonth() + 1
    const key = `budgetiq_autocopy_${curY}_${curM}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    autoFixedCopyToMonth(curY, curM, t)
      .then(count => {
        if (count > 0) {
          toast.success(`📌 Auto-copied ${count} recurring expense${count > 1 ? 's' : ''} from last month`, { duration: 4000 })
          loadAll({ skipExcel: true })
        }
      })
      .catch(e => {
        localStorage.removeItem(key)
        console.error('[AutoFixed]', e)
      })
  }, [authd])

  const autoSyncToDrive = useCallback(async () => {
    const t = getToken()
    const sid = getSheetId()
    if (!t || !sid) return
    try {
      const [allExpRows, allIncRows, freshCats] = await Promise.all([
        readAllExpenseRows(t),
        readAllIncomeRows(t),
        fetchCategoriesFS(sid)          // use Firestore, not the Sheet tab
      ])
      const toObjs = (rows, fields) => rows.map(r => {
        const obj = {}; fields.forEach((f, i) => obj[f] = r[i]); return obj
      })
      const exps = toObjs(allExpRows, ['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note'])
      const incs = toObjs(allIncRows, ['id', 'year', 'month', 'source', 'amount'])
      if (exps.length === 0 && incs.length === 0) return
      const years = new Set([
        String(new Date().getFullYear()),
        ...exps.map(e => String(e.year)),
        ...incs.map(i => String(i.year))
      ])
      years.delete('year'); years.delete('NaN'); years.delete('undefined')
      const { exportToExcel } = await import('../utils/exportExcel')
      const buffer = await exportToExcel(freshCats.length > 0 ? freshCats : DEFAULT_CATEGORIES, exps, incs, Array.from(years))
      await uploadExcelToDrive(buffer, userName, t)
    } catch (e) {
      console.error('[BudgetIQ] Auto-sync failed:', e)
    }
  }, [userName])

  return {
    categories, expenses, income, loading, needsSetup, availableYears,
    loadAll, autoSyncToDrive, setCategories, setNeedsSetup, missingConfig
  }
}
