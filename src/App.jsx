import React, { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import {
  fetchCategories, fetchExpenses, fetchIncome,
  saveExpense, deleteExpense, saveIncome, deleteIncome,
  saveCategory, deleteCategory, copyFixedToNextMonth,
  signInWithGoogle, signOut, isSignedIn, getToken,
  getUserProfile, findUserSpreadsheet, createUserSpreadsheet, setSheetId, setupSheet,
  DEFAULT_CATEGORIES, TABS, silentReauth, getSavedUserName, downloadExcelFromDrive
} from './api/sheets'
import Dashboard from './components/Dashboard'
import ExpenseTable from './components/ExpenseTable'
import CategoryManager from './components/CategoryManager'
import IncomeTable from './components/IncomeTable'
import AddExpenseModal from './components/AddExpenseModal'
import AddIncomeModal from './components/AddIncomeModal'
import ExportModal from './components/ExportModal'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR_NOW = new Date().getFullYear()
const MONTH_NOW = new Date().getMonth() + 1
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// Formats text to Sentence case and removes extra whitespace (e.g. "  movie Tickets " -> "Movie tickets")
const toSentenceCase = (str) => {
  if (!str) return ''
  const t = String(str).trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [year, setYear] = useState(YEAR_NOW)
  const [month, setMonth] = useState(MONTH_NOW)
  const [dashFilterMonth, setDashFilterMonth] = useState(null)  // null = all months
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
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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

      const rawExps = await fetchExpenses(year, t)
      const rawInc = await fetchIncome(year, t)

      const yearStr = String(year)

      // ONE-TIME MIGRATION: If Sheets DB is empty but Drive Excel has data, seed the Sheets DB
      if (rawExps.length === 0 && xlsxExps.length > 0) {
        const { writeAllExpenseRows, writeAllIncomeRows } = await import('./api/sheets')

        // Format rows for the DB schema
        const expRows = xlsxExps.map(e => [e.id, e.year, e.month, e.categoryId, e.itemName, e.amount, e.isFixed, e.note || ''])
        const incRows = xlsxInc.map(i => [i.id, i.year, i.month, i.source, i.amount])

        await writeAllExpenseRows(expRows, t)
        await writeAllIncomeRows(incRows, t)

        rawExps.push(...xlsxExps.filter(e => e.year === yearStr))
        rawInc.push(...xlsxInc.filter(i => i.year === yearStr))
      }

      // If we already have data in DB, just use that. If not, fallback to whatever we have.
      const filteredXlsxExps = xlsxExps.filter(e => e.year === yearStr)
      const filteredXlsxInc = xlsxInc.filter(i => i.year === yearStr)
      const finalExps = rawExps.length > 0 ? rawExps : filteredXlsxExps
      const finalInc = rawInc.length > 0 ? rawInc : filteredXlsxInc

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
    setShowProfileMenu(false)
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
    if (!t) { toast.error('Please sign in to save changes'); return }
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
    } catch (e) { toast.error(e.message) }
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
    setDeleteConfirm(null)
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
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
      } else {
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
      }
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message) }
  }

  // ── INCOME CRUD ──────────────────────────────────────────────
  const handleSaveIncome = async (inc, applyMode = 'single') => {
    inc.source = toSentenceCase(inc.source)
    const t = getToken()
    if (!t) { toast.error('Please sign in to save changes'); return }
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
    } catch (e) { toast.error(e.message) }
  }

  const handleDeleteIncome = async (inc) => {
    setDeleteConfirm({ type: 'income', item: inc })
  }

  // ── CATEGORY CRUD ────────────────────────────────────────────
  const handleSaveCategory = async (cat) => {
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try { await saveCategory(cat, t); toast.success('Saved!'); loadAll({ skipExcel: true }); autoSyncToDrive() }
    catch (e) { toast.error(e.message) }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Expenses using it will keep the old ID.')) return
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try { await deleteCategory(id, t); toast.success('Deleted'); loadAll({ skipExcel: true }); autoSyncToDrive() }
    catch (e) { toast.error(e.message) }
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

  // ── COPY FIXED ───────────────────────────────────────────────
  const handleCopyFixed = async () => {
    const t = getToken()
    if (!t) { toast.error('Sign in required'); return }
    try {
      const r = await copyFixedToNextMonth(year, month, t)
      toast.success(`Copied ${r.copied} fixed expenses to ${MONTHS[r.toMonth - 1]} ${r.toYear}`)
      loadAll({ skipExcel: true })
      autoSyncToDrive()
    } catch (e) { toast.error(e.message) }
  }

  // ── CONFIG SCREEN ─────────────────────────────────────────────
  if (missingConfig) return <ConfigScreen />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border2)' } }} />

      {/* ── TOPBAR ── */}
      <div className="topbar-wrap">
        <div className="topbar">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>BudgetIQ</span>
          </div>

          {/* Nav */}
          <div className="nav-btns">
            {['dashboard', 'expenses', 'income', 'categories'].map(v => (
              <button key={v} onClick={() => setView(v)} title={v.charAt(0).toUpperCase() + v.slice(1) + ' view'}
                style={{
                  border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 600, fontSize: 13, textTransform: 'capitalize', whiteSpace: 'nowrap',
                  color: view === v ? 'var(--accent)' : 'var(--text2)',
                  background: view === v ? 'rgba(91,127,255,0.1)' : 'transparent'
                }}>{v}</button>
            ))}
          </div>

          {/* Actions */}
          <div className="action-btns" style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {authd && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 16, padding: '4px 10px' }}
                onClick={() => { loadAll(); toast.success('Refreshing data from Google Sheets…', { duration: 2000 }) }}
                title="Refresh data from Google Sheets"
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ display: 'block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>
            )}
            <button className="btn btn-ghost" style={{ fontSize: 16, padding: '4px 10px' }} onClick={() => { setExportMode('drive'); setModal('export') }} title="Upload to Google Drive">
              <svg width="18" height="18" viewBox="0 0 87.3 78" style={{ verticalAlign: 'middle' }}>
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.7c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47" />
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z" fill="#EA4335" />
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D" />
                <path d="M59.85 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.5c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC" />
                <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.2 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
              </svg>
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 16, padding: '4px 10px' }} onClick={() => { setExportMode('local'); setModal('export') }} title="Download to your device">⬇</button>

            <div style={{ position: 'relative', marginLeft: 6 }}>
              {authd ? (
                <>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 20,
                      background: 'var(--surface3)', border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'all 0.2s', position: 'relative'
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      fontSize: 12, fontWeight: 800, textAlign: 'center', overflow: 'hidden'
                    }}>
                      {userPicture ? (
                        <img src={userPicture} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        userName ? userName.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginRight: 4 }}>{userName}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>▼</span>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div
                        onClick={() => setShowProfileMenu(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 1100 }}
                      />
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 220,
                        background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12,
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)', zIndex: 1101, overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease', padding: 8
                      }}>
                        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--accent)' }}>
                            {userPicture ? (
                              <img src={userPicture} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                {userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' }}>Google Account</div>
                          </div>
                        </div>

                        <button
                          onClick={handleSignOut}
                          style={{
                            width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                            background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 0.2s', borderRadius: 8
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,95,95,0.1)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none' }}
                        >
                          <span style={{ fontSize: 16 }}>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12, whiteSpace: 'nowrap', borderRadius: 20 }} onClick={handleSignIn} title="Sign in with Google to access your data">
                  🔑 Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="content-area">
        {!authd ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', animation: 'fadeIn 0.3s' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Sign In Required</h2>
            <p style={{ color: 'var(--text2)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              For your privacy, this dashboard is securely locked. Please sign in with your Google account to view and manage your budget data.
            </p>
            <button className="btn btn-primary" onClick={handleSignIn} style={{ fontSize: 16, padding: '12px 24px' }}>
              🔑 Sign In to View Dashboard
            </button>
          </div>
        ) : (
          <>
            {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading from Google Sheets…</div>}

            {needsSetup && !loading && (
              <div style={{ background: 'rgba(255, 95, 95, 0.1)', border: '1px solid var(--danger)', padding: 32, borderRadius: 12, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
                <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>Your Google Sheet needs to be set up!</h3>
                <p style={{ color: 'var(--text2)', marginBottom: 20 }}>We couldn't find the required tabs (Categories, Expenses, Income).</p>
                {authd ? (
                  <button className="btn btn-primary" onClick={async () => {
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
                  }}>Auto-Setup Sheets Now</button>
                ) : (
                  <button className="btn btn-primary" onClick={handleSignIn}>Sign In to Auto-Setup</button>
                )}
              </div>
            )}

            {!loading && !needsSetup && view === 'dashboard' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h2 style={{ fontWeight: 800, fontSize: 18, marginRight: 4 }}>Dashboard</h2>
                  {/* Year Tabs */}
                  <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '3px' }}>
                    {availableYears.map(y => (
                      <button key={y} onClick={() => setYear(y)}
                        style={{
                          padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', border: 'none', transition: 'all 0.18s',
                          background: year === y ? 'var(--accent)' : 'transparent',
                          color: year === y ? 'white' : 'var(--text2)',
                          boxShadow: year === y ? '0 2px 8px rgba(91,127,255,0.35)' : 'none',
                        }}>
                        {y}
                      </button>
                    ))}
                  </div>

                </div>
                <Dashboard expenses={expenses} income={income} categories={categories} year={year} month={month} filterMonth={dashFilterMonth} onMonthChange={m => { setMonth(m); setDashFilterMonth(m) }} />
              </>
            )}

            {!loading && !needsSetup && view === 'expenses' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <h2 style={{ fontWeight: 800, fontSize: 18 }}>Expenses</h2>
                  <select value={year} onChange={e => setYear(+e.target.value)} style={{ width: 80 }} title="Select year">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={month} onChange={e => setMonth(+e.target.value)} style={{ width: 80 }} title="Select month">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <div style={{ flex: 1 }} />
                  {authd && <>
                    <button className="btn btn-ghost" onClick={handleCopyFixed} title="Copy all fixed expenses to next month">📋 Copy Fixed → Next Month</button>
                    <button className="btn btn-primary" onClick={() => { setEditRow(null); setModal('add-expense') }}>+ Add Expense</button>
                  </>}
                </div>
                <ExpenseTable
                  expenses={expenses.filter(e => e.month === String(month))}
                  categories={categories}
                  onEdit={row => { setEditRow(row); setModal('add-expense') }}
                  onDelete={handleDeleteExpense}
                  canEdit={authd}
                />
              </>
            )}

            {!loading && !needsSetup && view === 'income' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <h2 style={{ fontWeight: 800, fontSize: 18 }}>Income</h2>
                  <select value={year} onChange={e => setYear(+e.target.value)} style={{ width: 80 }} title="Select year">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={month} onChange={e => setMonth(+e.target.value)} style={{ width: 80 }} title="Select month">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <div style={{ flex: 1 }} />
                  {authd && <button className="btn btn-primary" onClick={() => { setEditRow(null); setModal('add-income') }}>+ Add Income</button>}
                </div>
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
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                  <h2 style={{ fontWeight: 800, fontSize: 18, flex: 1 }}>Categories</h2>
                  {authd && <button className="btn btn-primary" onClick={() => { setEditRow(null); setModal('category') }}>+ Add Category</button>}
                </div>
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
      </div>

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
      {modal === 'category' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-title" style={{ textAlign: 'center' }}>{editRow ? '✏️ Edit Category' : '+ New Category'}</div>
            <CategoryForm initial={editRow} onSave={c => { handleSaveCategory(c); setModal(null); setEditRow(null) }} onCancel={() => { setModal(null); setEditRow(null) }} />
          </div>
        </div>
      )}
      {modal === 'export' && (
        <ExportModal
          categories={categories}
          mode={exportMode}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div className="modal-title">Delete {deleteConfirm.type === 'expense' ? deleteConfirm.item.itemName : deleteConfirm.item.source}?</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Choose whether to delete just this month or remove it from all months in {deleteConfirm.item.year}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger" style={{ flex: 1, padding: '10px 12px', fontSize: 13 }} onClick={() => executeDelete('month')}>
                  🗓 This month
                </button>
                <button className="btn btn-danger" style={{ flex: 1, padding: '10px 12px', fontSize: 13, background: '#8B0000' }} onClick={() => executeDelete('year')}>
                  📅 Whole year
                </button>
              </div>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ id: initial?.id || '', name: initial?.name || '', type: initial?.type || 'expense', color: initial?.color || '#6c8fff' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const lblStyle = { display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><label style={lblStyle}>Category Name</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Groceries" /></div>
      <div><label style={lblStyle}>Type</label>
        <select value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="expense">Expense</option>
          <option value="fixed">Fixed Expense</option>
          <option value="savings">Savings / Investment</option>
          <option value="income">Income</option>
        </select></div>
      <div><label style={lblStyle}>Color</label>
        <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 60, height: 36, background: 'none', border: 'none', cursor: 'pointer' }} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <button className="btn btn-primary" style={{ width: '100%', padding: '10px 14px', fontSize: 14 }} onClick={() => form.name && onSave(form)}>💾 Save Category</button>
        <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ConfigScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: 36, maxWidth: 560, width: '100%' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Setup Required</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24, lineHeight: 1.7 }}>
          Create a <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file in your project root with the following keys:
        </p>
        <pre style={{ background: 'var(--surface2)', borderRadius: 10, padding: 18, fontSize: 13, color: 'var(--accent2)', lineHeight: 1.8, overflowX: 'auto' }}>{`VITE_GOOGLE_SHEETS_API_KEY=your_api_key
VITE_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id`}</pre>
        <div style={{ marginTop: 20, padding: 14, background: 'rgba(91,127,255,0.08)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
          📖 See <strong style={{ color: 'var(--text)' }}>SETUP.md</strong> in the project folder for step-by-step instructions.
        </div>
      </div>
    </div>
  )
}
