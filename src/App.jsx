import React, { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Box, Typography, Button, FormControl, Select } from '@mui/material'
import { useGlobalStyles } from './styles/globalStyles'
import { useStyles } from './App.styles'
import {
  fetchCategories, fetchExpenses, fetchIncome,
  saveExpense, deleteExpense, saveIncome, deleteIncome,
  saveCategory, deleteCategory, copyExpensesToNextMonth,
  signInWithGoogle, signOut, isSignedIn, getToken,
  getUserProfile, findUserSpreadsheet, createUserSpreadsheet, setSheetId, setupSheet,
  DEFAULT_CATEGORIES, TABS, silentReauth, getSavedUserName, downloadExcelFromDrive
} from './api/sheets'
import Dashboard from './components/Dashboard'
import ExpenseTable from './components/Expenses/ExpenseTable'
import CategoryManager from './components/Category/CategoryManager'
import IncomeTable from './components/Income/IncomeTable'
import AddExpenseModal from './components/Expenses/AddExpenseModal'
import AddIncomeModal from './components/Income/AddIncomeModal'
import ExportModal from './components/ExportModal'
import ConfigScreen from './components/ConfigScreen'
import SignInScreen from './components/SignInScreen'
import TopBar from './components/TopBar'
import SetupBanner from './components/SetupBanner'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import CategoryModal from './components/Category/CategoryModal'

import { MONTHS, YEAR_NOW, MONTH_NOW_1 as MONTH_NOW } from './utils/constants'
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// Formats text to Sentence case and removes extra whitespace (e.g. "  movie Tickets " -> "Movie tickets")
const toSentenceCase = (str) => {
  if (!str) return ''
  const t = String(str).trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

export default function App() {
  const { classes, cx } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()

  const [view, setView] = useState('dashboard')
  const [year, setYear] = useState(YEAR_NOW)
  const [month, setMonth] = useState(MONTH_NOW)
  const [dashFilterMonth, setDashFilterMonth] = useState(null)  // null = all months
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(false)
  const [authd, setAuthd] = useState(false)
  const [modal, setModal] = useState(null)   // 'add-expense' | 'add-income' | 'category' | 'export'
  const [editRow, setEditRow] = useState(null)
  const [exportMode, setExportMode] = useState('local') // 'drive' | 'local'
  const [availableYears, setAvailableYears] = useState([YEAR_NOW, YEAR_NOW + 1])
  const [needsSetup, setNeedsSetup] = useState(false)
  const [userName, setUserName] = useState(getSavedUserName() || '')
  const [userPicture, setUserPicture] = useState(localStorage.getItem('budgetiq_userPicture') || '')

  // ── CONFIG check ────────────────────────────────────────────
  const missingConfig = !import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ||
    !import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

  // ── LOAD DATA ─────────────────────────────────────────────────
  // Primary source: balance_sheet_.xlsx on Google Drive (parsed by parseExcel)
  // Fallback: flat Expenses/Income tabs in the app's Google Sheets DB
  const loadAll = useCallback(async (opts = {}) => {
    if (missingConfig) return
    const t = getToken()
    if (!t) { setCategories([]); setExpenses([]); setIncome([]); return }
    setLoading(true)
    setNeedsSetup(false)
    try {
      // Always load categories from Sheets (they define the category IDs)
      let cats = await fetchCategories(t)
      if (cats.length === 0) {
        // First-time setup: write all defaults
        const { appendRows } = await import('./api/sheets')
        await appendRows(TABS.CATEGORIES, DEFAULT_CATEGORIES.map(c => [c.id, c.name, c.type, c.color]), t)
        cats = DEFAULT_CATEGORIES
      } else {
        // Sync: add any missing default categories that don't exist yet
        const existingIds = new Set(cats.map(c => c.id))
        const missing = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id))
        if (missing.length > 0) {
          const { appendRows } = await import('./api/sheets')
          await appendRows(TABS.CATEGORIES, missing.map(c => [c.id, c.name, c.type, c.color]), t)
          cats = [...cats, ...missing]
        }
      }
      setCategories(cats)

      // ── Try Drive Excel first ────────────────────────────────
      let xlsxExps = [], xlsxInc = [], parsedYears = [], xlsxOk = false
      if (!opts.skipExcel) {
        try {
          const buffer = await downloadExcelFromDrive(t, userName)
          if (buffer) {
            const { importFromExcel } = await import('./utils/parseExcel')
            const parsed = await importFromExcel(buffer, cats)
            xlsxExps = parsed.expenses
            xlsxInc = parsed.income
            parsedYears = parsed.years.map(Number)
            xlsxOk = true
          } else {
            console.warn('[BudgetIQ] balance_sheet_.xlsx not found on Drive — using Sheets DB')
          }
        } catch (driveErr) {
          console.warn('[BudgetIQ] Drive Excel error:', driveErr.message)
        }
      }

      const yearStr = String(year)
      let rawExps = []
      let rawInc = []

      if (xlsxOk) {
        rawExps = xlsxExps.filter(e => String(e.year) === yearStr)
        rawInc = xlsxInc.filter(i => String(i.year) === yearStr)

        // Sync Drive Excel updates back to Sheets DB in the background
        ;(async () => {
          try {
            const { readAllExpenseRows, writeAllExpenseRows, readAllIncomeRows, writeAllIncomeRows } = await import('./api/sheets')
            const [dbExpRows, dbIncRows] = await Promise.all([
              readAllExpenseRows(t),
              readAllIncomeRows(t)
            ])

            // Reconcile expenses by business key: year-month-categoryId-itemName
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
                const amountDiff = String(existing[5]) !== String(xls.amount)
                const fixedDiff = String(existing[6]) !== String(xls.isFixed || 'FALSE')
                if (amountDiff || fixedDiff) {
                  expensesChanged = true
                }
                const updatedRow = [
                  existing[0],
                  xls.year,
                  xls.month,
                  xls.categoryId,
                  toSentenceCase(xls.itemName),
                  xls.amount,
                  xls.isFixed || existing[6] || 'FALSE',
                  existing[7] || ''
                ]
                reconciledExpenses.push(updatedRow)
                dbExpMap.delete(key)
              } else {
                expensesChanged = true
                const newRow = [
                  xls.id || uid(),
                  xls.year,
                  xls.month,
                  xls.categoryId,
                  toSentenceCase(xls.itemName),
                  xls.amount,
                  xls.isFixed || 'FALSE',
                  ''
                ]
                reconciledExpenses.push(newRow)
              }
            })

            if (dbExpMap.size > 0) {
              expensesChanged = true
            }

            if (expensesChanged) {
              await writeAllExpenseRows(reconciledExpenses, t)
            }

            // Reconcile income by business key: year-month-source
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
                if (String(existing[4]) !== String(xls.amount)) {
                  incomeChanged = true
                }
                const updatedRow = [
                  existing[0],
                  xls.year,
                  xls.month,
                  toSentenceCase(xls.source),
                  xls.amount
                ]
                reconciledIncome.push(updatedRow)
                dbIncMap.delete(key)
              } else {
                incomeChanged = true
                const newRow = [
                  xls.id || uid(),
                  xls.year,
                  xls.month,
                  toSentenceCase(xls.source),
                  xls.amount
                ]
                reconciledIncome.push(newRow)
              }
            })

            if (dbIncMap.size > 0) {
              incomeChanged = true
            }

            if (incomeChanged) {
              await writeAllIncomeRows(reconciledIncome, t)
            }
          } catch (syncErr) {
            console.error('[BudgetIQ] Sync to Sheets DB failed:', syncErr)
          }
        })()
      } else {
        rawExps = await fetchExpenses(year, t)
        rawInc = await fetchIncome(year, t)
      }

      const finalExps = rawExps
      const finalInc = rawInc

      // Ensure consistent formatting across all historical/raw data globally
      const exps = finalExps.map(e => ({ ...e, itemName: toSentenceCase(e.itemName) }))
      const inc = finalInc.map(i => ({ ...i, source: toSentenceCase(i.source) }))


      setExpenses(exps)
      setIncome(inc)

      // ── Dynamic year discovery ───────────────────────────────
      const years = new Set([YEAR_NOW, YEAR_NOW + 1])
      if (parsedYears.length > 0) {
        parsedYears.forEach(y => years.add(y))
      } else {
        exps.forEach(e => { if (e.year) years.add(+e.year) })
        inc.forEach(i => { if (i.year) years.add(+i.year) })
      }
      setAvailableYears(Array.from(years).sort((a, b) => a - b))

    } catch (e) {
      if (e.message.includes('Unable to parse range')) {
        setNeedsSetup(true)
      } else if (e.message.includes('The caller does not have permission')) {
        toast.error('Access Denied. Signing out...', { duration: 5000 })
        signOut(); setAuthd(false); setCategories([]); setExpenses([]); setIncome([])
      } else {
        toast.error('Load failed: ' + e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [year, missingConfig])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    setSelectedExpenseIds([])
  }, [year, month, view])

  // ── SCAN ALL YEARS on login ───────────────────────────────────
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
        const years = new Set(availableYears)
        allExp.forEach(e => { if (e.year) years.add(parseInt(e.year)) })
        allInc.forEach(i => { if (i.year) years.add(parseInt(i.year)) })
        const sorted = Array.from(years).sort((a, b) => a - b)
        if (sorted.length !== availableYears.length) {
          setAvailableYears(sorted)
        }
      } catch (e) {
        console.error('Year scan failed:', e)
      }
    }
    scanYears()
  }, [authd])

  // ── SESSION RESTORE on mount ──────────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      // 1. Check if token is still valid in localStorage
      if (isSignedIn()) {
        setAuthd(true)
        return
      }
      // 2. If we have a saved userName + sheetId but the token expired, try silent re-auth
      const savedName = getSavedUserName()
      if (savedName) {
        try {
          await silentReauth()
          setAuthd(true)
        } catch {
          // Silent re-auth failed — user needs to sign in manually
        }
      }
    }
    restoreSession()
  }, [])

  // ── AUTH ──────────────────────────────────────────────────────
  const handleSignIn = async () => {
    try {
      toast.loading('Authenticating...', { id: 'auth' })
      const token = await signInWithGoogle()

      toast.loading('Finding your personal database...', { id: 'auth' })
      const profile = await getUserProfile(token)
      const userName = profile.given_name || profile.name || 'User'
      const userPic = profile.picture || ''
      localStorage.setItem('budgetiq_userName', userName)
      localStorage.setItem('budgetiq_userPicture', userPic)
      setUserName(userName)
      setUserPicture(userPic)

      let sid = await findUserSpreadsheet(token, userName)
      if (!sid) {
        toast.loading(`Creating personal database for ${userName}...`, { id: 'auth' })
        sid = await createUserSpreadsheet(token, userName)
        setSheetId(sid)
        toast.loading('Setting up new sheets...', { id: 'auth' })
        await setupSheet(token)
      } else {
        setSheetId(sid)
      }

      setAuthd(true)
      toast.success(`Welcome, ${userName}!`, { id: 'auth' })
      loadAll()
    } catch (e) {
      toast.error('Sign-in failed: ' + e.message, { id: 'auth' })
    }
  }
  const handleSignOut = () => {
    signOut()
    setAuthd(false)
    setUserName('')
    setUserPicture('')
    setCategories([])
    setExpenses([])
    setIncome([])
    toast('Signed out')
  }

  // ── AUTO-SYNC EXCEL TO DRIVE ──────────────────────────────────
  const autoSyncToDrive = async () => {
    const t = getToken()
    if (!t) return
    try {
      const { readAllExpenseRows, readAllIncomeRows, fetchCategories } = await import('./api/sheets')
      const [allExpRows, allIncRows, freshCats] = await Promise.all([
        readAllExpenseRows(t),
        readAllIncomeRows(t),
        fetchCategories(t)
      ])

      const rowsToObjects = (rows, fields) => rows.map(r => {
        const obj = {}; fields.forEach((f, i) => obj[f] = r[i]); return obj
      })
      const exps = rowsToObjects(allExpRows, ['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note'])
      const incs = rowsToObjects(allIncRows, ['id', 'year', 'month', 'source', 'amount'])

      if (exps.length === 0 && incs.length === 0) {
        return
      }

      const years = new Set([
        '2026', '2027',
        ...exps.map(e => String(e.year)),
        ...incs.map(i => String(i.year))
      ])
      // Remove any headers or invalid dates mapped by accident
      years.delete('year')
      years.delete('NaN')
      years.delete('undefined')

      const { exportToExcel } = await import('./utils/exportExcel')
      const buffer = await exportToExcel(freshCats.length > 0 ? freshCats : DEFAULT_CATEGORIES, exps, incs, Array.from(years))

      const { uploadExcelToDrive } = await import('./api/sheets')
      await uploadExcelToDrive(buffer, userName, t)
    } catch (e) {
      console.error('[BudgetIQ] Auto-sync failed:', e)
    }
  }

  // ── EXPENSE CRUD ─────────────────────────────────────────────
  const handleSaveExpense = async (exp, applyMode = 'single') => {
    exp.itemName = toSentenceCase(exp.itemName)
    const t = getToken()
    if (!t) {
      const err = new Error('Please sign in to save changes')
      toast.error(err.message)
      throw err
    }
    try {
      if (applyMode === 'single') {
        await saveExpense(exp, t)
        toast.success(exp.id ? 'Updated!' : 'Added!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(exp.month)
        const endMonth = 12
        const count = endMonth - startMonth + 1

        toast.loading(`Saving to ${count} months...`, { id: 'multi-exp' })

        // Read ALL expenses once, mutate in memory, write back once
        const { readAllExpenseRows, writeAllExpenseRows } = await import('./api/sheets')
        const allRows = await readAllExpenseRows(t)

        for (let m = startMonth; m <= endMonth; m++) {
          const existIdx = allRows.findIndex(r =>
            r[4] === exp.itemName && r[3] === exp.categoryId &&
            String(r[1]) === String(exp.year) && String(r[2]) === String(m)
          )
          const row = [existIdx >= 0 ? allRows[existIdx][0] : uid(), exp.year, m, exp.categoryId, exp.itemName, exp.amount, exp.isFixed ? 'TRUE' : 'FALSE', exp.note || '']
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }

        await writeAllExpenseRows(allRows, t)
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-exp', duration: 3000 })
      }

      setModal(null); setEditRow(null)
      loadAll({ skipExcel: true }) // UI updates instantly from Sheets DB
      autoSyncToDrive()            // Background update to Excel file
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  // ── FIELD UPDATE (inline edit per column) ────────────────────
  const handleFieldUpdate = async (expense, field, value, scope) => {
    if (field === 'itemName') value = toSentenceCase(value)
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
        const { readAllExpenseRows, writeAllExpenseRows } = await import('./api/sheets')
        const allRows = await readAllExpenseRows(t)
        // field index mapping: [id=0, year=1, month=2, categoryId=3, itemName=4, amount=5, isFixed=6, note=7]
        const fieldIdx = { itemName: 4, categoryId: 3, amount: 5, isFixed: 6, note: 7 }
        const idx = fieldIdx[field]
        let count = 0
        for (let i = 0; i < allRows.length; i++) {
          if (allRows[i][4] === expense.itemName &&
            allRows[i][3] === expense.categoryId &&
            String(allRows[i][1]) === String(expense.year)) {
            allRows[i][idx] = field === 'isFixed' ? (value ? 'TRUE' : 'FALSE') : value
            count++
          }
        }
        await writeAllExpenseRows(allRows, t)
        toast.success(`Updated in ${count} months!`, { id: 'field-update' })
      }
      setEditField(null)
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message) }
  }

  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'expense'|'income', item }

  const handleDeleteExpense = async (exp) => {
    setDeleteConfirm({ type: 'expense', item: exp })
  }

  const executeDelete = async (scope) => {
    const { type, item } = deleteConfirm
    const t = getToken()
    if (!t) {
      const err = new Error('Sign in required')
      toast.error(err.message)
      throw err
    }
    try {
      if (type === 'expense') {
        if (scope === 'month') {
          await deleteExpense(item.id, t)
          toast.success('Deleted from this month')
        } else {
          toast.loading('Deleting from all months...', { id: 'del-all' })
          const { readAllExpenseRows, writeAllExpenseRows } = await import('./api/sheets')
          const allRows = await readAllExpenseRows(t)
          const filtered = allRows.filter(r =>
            !(r[4] === item.itemName && r[3] === item.categoryId && String(r[1]) === String(item.year))
          )
          await writeAllExpenseRows(filtered, t)
          toast.success('Deleted from all months!', { id: 'del-all' })
        }
      } else if (type === 'income') {
        if (scope === 'month') {
          await deleteIncome(item.id, t)
          toast.success('Deleted from this month')
        } else {
          toast.loading('Deleting from all months...', { id: 'del-all' })
          const { readAllIncomeRows, writeAllIncomeRows } = await import('./api/sheets')
          const allRows = await readAllIncomeRows(t)
          const filtered = allRows.filter(r =>
            !(r[3] === item.source && String(r[1]) === String(item.year))
          )
          await writeAllIncomeRows(filtered, t)
          toast.success('Deleted from all months!', { id: 'del-all' })
        }
      } else if (type === 'category') {
        await deleteCategory(item.id, t)
        toast.success('Deleted')
      }
      setDeleteConfirm(null)
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  // ── INCOME CRUD ──────────────────────────────────────────────
  const handleSaveIncome = async (inc, applyMode = 'single') => {
    inc.source = toSentenceCase(inc.source)
    const t = getToken()
    if (!t) {
      const err = new Error('Please sign in to save changes')
      toast.error(err.message)
      throw err
    }
    try {
      if (applyMode === 'single') {
        await saveIncome(inc, t)
        toast.success(inc.id ? 'Updated!' : 'Added!')
      } else {
        const startMonth = applyMode === 'all_year' ? 1 : parseInt(inc.month)
        const endMonth = 12
        const count = endMonth - startMonth + 1

        toast.loading(`Saving to ${count} months...`, { id: 'multi-income' })

        // Read ALL income once, mutate in memory, write back once
        const { readAllIncomeRows, writeAllIncomeRows } = await import('./api/sheets')
        const allRows = await readAllIncomeRows(t)

        for (let m = startMonth; m <= endMonth; m++) {
          const existIdx = allRows.findIndex(r =>
            r[3] === inc.source &&
            String(r[1]) === String(inc.year) && String(r[2]) === String(m)
          )
          const row = [existIdx >= 0 ? allRows[existIdx][0] : uid(), inc.year, m, inc.source, inc.amount]
          if (existIdx >= 0) allRows[existIdx] = row
          else allRows.push(row)
        }

        await writeAllIncomeRows(allRows, t)
        toast.success(`✅ Applied to ${count} months!`, { id: 'multi-income', duration: 3000 })
      }

      setModal(null); setEditRow(null)
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  const handleDeleteIncome = async (inc) => {
    setDeleteConfirm({ type: 'income', item: inc })
  }

  // ── CATEGORY CRUD ────────────────────────────────────────────
  const handleSaveCategory = async (cat) => {
    const t = getToken()
    if (!t) {
      const err = new Error('Sign in required')
      toast.error(err.message)
      throw err
    }
    try {
      await saveCategory(cat, t)
      toast.success('Saved!')
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  const handleDeleteCategory = (cat) => {
    setDeleteConfirm({ type: 'category', item: cat })
  }

  const handleReorderCategory = async (orderedCats) => {
    const t = getToken()
    if (!t) return
    setCategories(orderedCats)
    try {
      const { reorderCategories } = await import('./api/sheets')
      await reorderCategories(orderedCats, t)
      toast.success('Category order saved!')
      autoSyncToDrive()
    } catch (e) { toast.error('Reorder failed: ' + e.message); loadAll({ skipExcel: true }) }
  }

  // ── COPY SELECTED ─────────────────────────────────────────────
  const handleCopySelected = async () => {
    if (selectedExpenseIds.length === 0) {
      toast.error('No expenses selected')
      return
    }
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try {
      toast.loading('Copying selected expenses...', { id: 'copy-selected' })
      const r = await copyExpensesToNextMonth(year, month, selectedExpenseIds, t)
      toast.success(`Copied ${r.copied} expenses to ${MONTHS[r.toMonth - 1]} ${r.toYear}`, { id: 'copy-selected' })
      setSelectedExpenseIds([])
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message, { id: 'copy-selected' }) }
  }

  // ── CONFIG SCREEN ─────────────────────────────────────────────
  if (missingConfig) return <ConfigScreen />

  return (
    <Box className={globalClasses.globalContainer}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#101218', color: '#e4e8f5', border: '1px solid rgba(255,255,255,0.13)' } }} />

      {/* ── TOPBAR ── */}
      <TopBar
        view={view}
        setView={setView}
        authd={authd}
        loading={loading}
        userName={userName}
        userPicture={userPicture}
        onRefresh={() => { loadAll(); toast.success('Refreshing data from Google Sheets…', { duration: 2000 }) }}
        onExportDrive={() => { setExportMode('drive'); setModal('export') }}
        onExportLocal={() => { setExportMode('local'); setModal('export') }}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* ── CONTENT ── */}
      <Box className={globalClasses.contentArea}>
        {!authd ? (
          <SignInScreen onSignIn={handleSignIn} />
        ) : (
          <>
            {loading && <Typography align="center" sx={{ p: 5, color: '#8891b8' }}>Loading from Google Sheets…</Typography>}

            {needsSetup && !loading && (
              <SetupBanner
                authd={authd}
                onSetup={async () => {
                  const t = getToken()
                  try {
                    toast.loading('Setting up your sheet...', { id: 'setup' })
                    const { setupSheet } = await import('./api/sheets')
                    await setupSheet(t)
                    toast.success('Sheet setup complete!', { id: 'setup' })
                    setNeedsSetup(false)
                    loadAll()
                  } catch (err) {
                    toast.error(err.message, { id: 'setup' })
                  }
                }}
                onSignIn={handleSignIn}
              />
            )}

            {!loading && !needsSetup && view === 'dashboard' && (
              <>
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={classes.titleText}>
                    Dashboard
                  </Typography>
                  {/* Year Tabs */}
                  <Box className={classes.yearTabsContainer}>
                    {availableYears.map(y => (
                      <Button
                        key={y}
                        onClick={() => setYear(y)}
                        size="small"
                        className={cx(classes.yearTabButton, year === y && classes.yearTabActiveButton)}
                      >
                        {y}
                      </Button>
                    ))}
                  </Box>
                </Box>
                <Dashboard expenses={expenses} income={income} categories={categories} year={year} month={month} filterMonth={dashFilterMonth} onMonthChange={m => { setMonth(m); setDashFilterMonth(m) }} />
              </>
            )}

            {!loading && !needsSetup && view === 'expenses' && (
              <>
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={classes.titleText}>
                    Expenses
                  </Typography>
                  <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                    <Select
                      value={year}
                      onChange={e => setYear(+e.target.value)}
                      native
                      className={globalClasses.nativeSelect}
                    >
                      {availableYears.map(y => <option key={y} value={y} style={{ background: '#181b28', color: '#e4e8f5' }}>{y}</option>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                    <Select
                      value={month}
                      onChange={e => setMonth(+e.target.value)}
                      native
                      className={globalClasses.nativeSelect}
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i + 1} style={{ background: '#181b28', color: '#e4e8f5' }}>{m}</option>)}
                    </Select>
                  </FormControl>
                  <Box className={classes.flexFiller} />
                  {authd && (
                    <Box className={classes.actionButtonsContainer}>
                      {selectedExpenseIds.length > 0 && (
                        <Button
                          variant="contained"
                          onClick={handleCopySelected}
                          size="small"
                          className={globalClasses.containedBlueButton}
                        >
                          📋 Copy Selected ({selectedExpenseIds.length}) → Next Month
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => { setEditRow(null); setModal('add-expense') }}
                        size="small"
                        className={globalClasses.containedBlueButton}
                      >
                        + Add Expense
                      </Button>
                    </Box>
                  )}
                </Box>
                <ExpenseTable
                  expenses={expenses.filter(e => e.month === String(month))}
                  categories={categories}
                  onEdit={row => { setEditRow(row); setModal('add-expense') }}
                  onDelete={handleDeleteExpense}
                  canEdit={authd}
                  selectedIds={selectedExpenseIds}
                  onSelectionChange={setSelectedExpenseIds}
                />
              </>
            )}

            {!loading && !needsSetup && view === 'income' && (
              <>
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={classes.titleText}>
                    Income
                  </Typography>
                  <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                    <Select
                      value={year}
                      onChange={e => setYear(+e.target.value)}
                      native
                      className={globalClasses.nativeSelect}
                    >
                      {availableYears.map(y => <option key={y} value={y} style={{ background: '#181b28', color: '#e4e8f5' }}>{y}</option>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                    <Select
                      value={month}
                      onChange={e => setMonth(+e.target.value)}
                      native
                      className={globalClasses.nativeSelect}
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i + 1} style={{ background: '#181b28', color: '#e4e8f5' }}>{m}</option>)}
                    </Select>
                  </FormControl>
                  <Box className={classes.flexFiller} />
                  {authd && (
                    <Button
                      variant="contained"
                      onClick={() => { setEditRow(null); setModal('add-income') }}
                      size="small"
                      className={globalClasses.containedBlueButton}
                    >
                      + Add Income
                    </Button>
                  )}
                </Box>
                <IncomeTable
                  income={income.filter(i => i.month === String(month))}
                  onEdit={row => { setEditRow(row); setModal('add-income') }}
                  onDelete={handleDeleteIncome}
                  canEdit={authd}
                />
              </>
            )}

            {!loading && !needsSetup && view === 'categories' && (
              <>
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={cx(classes.titleText, classes.flexFiller)}>
                    Categories
                  </Typography>
                  {authd && (
                    <Button
                      variant="contained"
                      onClick={() => { setEditRow(null); setModal('category') }}
                      size="small"
                      className={globalClasses.containedBlueButton}
                    >
                      + Add Category
                    </Button>
                  )}
                </Box>
                <CategoryManager
                  categories={categories}
                  onEdit={row => { setEditRow(row); setModal('category') }}
                  onDelete={handleDeleteCategory}
                  onReorder={handleReorderCategory}
                  onSave={handleSaveCategory}
                  canEdit={authd}
                />
              </>
            )}
          </>
        )}
      </Box>

      {/* ── MODALS ── */}
      {modal === 'add-expense' && (
        <AddExpenseModal
          initial={editRow}
          categories={categories}
          year={year} month={month}
          onSave={handleSaveExpense}
          onClose={() => { setModal(null); setEditRow(null) }}
        />
      )}
      {modal === 'add-income' && (
        <AddIncomeModal
          initial={editRow}
          year={year} month={month}
          onSave={handleSaveIncome}
          onClose={() => { setModal(null); setEditRow(null) }}
        />
      )}
      <CategoryModal
        open={modal === 'category'}
        initial={editRow}
        categories={categories}
        onSave={handleSaveCategory}
        onClose={() => { setModal(null); setEditRow(null) }}
      />
      {modal === 'export' && (
        <ExportModal
          categories={categories}
          mode={exportMode}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={!!deleteConfirm}
        item={deleteConfirm?.item}
        type={deleteConfirm?.type}
        onDelete={executeDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </Box>
  )
}
