import React, { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Box, Typography, Button, FormControl, Select } from '@mui/material'
import { useGlobalStyles } from './styles/globalStyles'
import { useStyles } from './App.styles'
import {
  deleteExpense, deleteIncome,
  readAllExpenseRows, writeAllExpenseRows,
  readAllIncomeRows, writeAllIncomeRows,
  getToken, getSheetId, setupSheet, getDriveExcelUrl
} from './api/sheets'
import { deleteCategoryFS } from './api/firestoreCategories'
import { getPinFS, setPinFS } from './api/firestoreSettings'
import PinScreen from './components/PinScreen'


import { useAuth } from './hooks/useAuth'
import { useBudgetData } from './hooks/useBudgetData'
import { useExpenses } from './hooks/useExpenses'
import { useIncome } from './hooks/useIncome'
import { useCategories } from './hooks/useCategories'

import Dashboard from './components/Dashboard'
import ExpensesByCategory from './components/Expenses/ExpensesByCategory'
import AIInsightsSection from './components/Dashboard/subcomponents/AIInsightsSection'
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
import ErrorBoundary from './components/ErrorBoundary'

import { MONTHS, YEAR_NOW, MONTH_NOW_1 as MONTH_NOW, toSentenceCase, defaultMonths } from './utils/constants'

export default function App() {
  const { classes, cx } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()

  // ── Auth first — authd needed by PIN gate effect below ────────
  const { authd, userName, userFullName, userPicture, handleSignIn, handleSignOut } = useAuth()

  // ── UI state ──────────────────────────────────────────────────
  const [view, setView] = useState('dashboard')
  const [year, setYear] = useState(YEAR_NOW)
  const [month, setMonth] = useState(MONTH_NOW)
  const [selMonths, setSelMonths] = useState(() => defaultMonths(YEAR_NOW))

  // ── PIN state ─────────────────────────────────────────────────
  const [pinMode, setPinMode] = useState(null)      // null | 'setup' | 'entry'
  const [pinVerified, setPinVerified] = useState(
    () => sessionStorage.getItem('budgetiq_pin_verified') === '1'
  )

  const [txnTab, setTxnTab] = useState('expenses')
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)

  const isLocked = parseInt(year) < new Date().getFullYear()

  // Reset selMonths when year changes
  useEffect(() => { setSelMonths(defaultMonths(year)) }, [year])

  // ── PIN gate ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authd || pinVerified) return
    const sid = getSheetId()
    if (!sid) return
    getPinFS(sid).then(existing => {
      setPinMode(existing === null ? 'setup' : 'entry')
    }).catch(() => {
      // Firebase error — skip PIN gate rather than block the app
      setPinVerified(true)
    })
  }, [authd])

  useEffect(() => { if (view !== 'expenses') setTxnTab('expenses') }, [view])
  useEffect(() => { setSelectedExpenseIds([]) }, [year, month, view])

  const closeModal = useCallback(() => { setModal(null); setEditRow(null) }, [])

  // ── Data ──────────────────────────────────────────────────────
  const {
    categories, expenses, income, loading, needsSetup, availableYears,
    loadAll, autoSyncToDrive, setCategories, setNeedsSetup, missingConfig
  } = useBudgetData({ authd, userName, onUnauthorized: handleSignOut })

  // ── CRUD hooks ────────────────────────────────────────────────
  const { handleSaveExpense, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment } = useExpenses({
    loadAll, autoSyncToDrive, year, month, setDeleteConfirm, closeModal,
    clearSelection: () => setSelectedExpenseIds([])
  })
  const { handleSaveIncome, handleDeleteIncome } = useIncome({
    loadAll, autoSyncToDrive, setDeleteConfirm, closeModal
  })
  const { handleSaveCategory, handleDeleteCategory, handleReorderCategory } = useCategories({
    loadAll, autoSyncToDrive, setDeleteConfirm, setCategories
  })

  // ── Delete dispatch ───────────────────────────────────────────
  const executeDelete = async (scope) => {
    const { type, item } = deleteConfirm
    const targetYear = parseInt(item?.year || year)
    if (type !== 'category' && targetYear && targetYear < new Date().getFullYear()) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    const t = getToken()
    if (!t) {
      const err = new Error('Sign in required')
      toast.error(err.message); throw err
    }
    try {
      if (type === 'expense') {
        if (scope === 'month') {
          await deleteExpense(item.id, t)
          toast.success('Deleted from this month')
        } else {
          toast.loading('Deleting from all months...', { id: 'del-all' })
          const allRows = await readAllExpenseRows(t)
          const filtered = allRows.filter(r =>
            !(toSentenceCase(r[4]) === toSentenceCase(item.itemName) &&
              r[3] === item.categoryId && String(r[1]) === String(item.year))
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
          const allRows = await readAllIncomeRows(t)
          const filtered = allRows.filter(r =>
            !(toSentenceCase(r[3]) === toSentenceCase(item.source) && String(r[1]) === String(item.year))
          )
          await writeAllIncomeRows(filtered, t)
          toast.success('Deleted from all months!', { id: 'del-all' })
        }
      } else if (type === 'category') {
        const sid = getSheetId()
        await deleteCategoryFS(sid, item.id)
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

  // ── Open spreadsheet ──────────────────────────────────────────
  const handleOpenDrive = async () => {
    const t = getToken()
    if (!t) { toast.error('Sign in to open spreadsheet'); return }
    try {
      toast.loading('Finding your spreadsheet…', { id: 'open-drive' })
      const url = await getDriveExcelUrl(t, userName)
      toast.dismiss('open-drive')
      if (!url) { toast.error('No spreadsheet found yet — add some data first'); return }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error('Could not open spreadsheet: ' + e.message, { id: 'open-drive' })
    }
  }

  // ── Config check ──────────────────────────────────────────────
  if (missingConfig) return <ConfigScreen />

  // ── PIN gate ──────────────────────────────────────────────────
  if (authd && !pinVerified && pinMode) {
    const sid = getSheetId()
    const unlock = () => {
      sessionStorage.setItem('budgetiq_pin_verified', '1')
      setPinVerified(true)
      setPinMode(null)
    }
    return (
      <PinScreen
        mode={pinMode}
        userName={userName}
        sheetId={sid}
        onSetPin={async (pin) => { await setPinFS(sid, pin) }}
        onVerify={async (enteredPin) => {
          // Verify only — do NOT unlock here. PinScreen calls onUnlock when it's
          // truly done, so it can offer biometric enrollment before unmounting.
          if (pinMode === 'setup') return true
          if (enteredPin === null) return true            // biometric bypass
          const stored = await getPinFS(sid)              // PIN entry
          return enteredPin === stored
        }}
        onUnlock={unlock}
      />
    )
  }

  return (
    <Box className={globalClasses.globalContainer}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#101218', color: '#e4e8f5', border: '1px solid rgba(255,255,255,0.13)' } }} />

      <TopBar
        view={view}
        setView={setView}
        authd={authd}
        loading={loading}
        userName={userName}
        userPicture={userPicture}
        onRefresh={() => { loadAll(); toast.success('Refreshing data from Google Sheets…', { duration: 2000 }) }}
        onOpenDrive={handleOpenDrive}
        onExportLocal={() => setModal('export')}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onAIInsights={() => setAiOpen(true)}
        hasAIKey={!!import.meta.env.VITE_GEMINI_API_KEY}
      />

      <Box className={globalClasses.contentArea}>
        {!authd ? (
          <SignInScreen onSignIn={handleSignIn} />
        ) : (
          <>
            {loading && (
              <Typography align="center" sx={{ p: 5, color: '#8891b8' }}>
                Loading from Google Sheets…
              </Typography>
            )}

            {needsSetup && !loading && (
              <SetupBanner
                authd={authd}
                onSetup={async () => {
                  const t = getToken()
                  try {
                    toast.loading('Setting up your sheet...', { id: 'setup' })
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
              <ErrorBoundary>
                {isLocked && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>🔒</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Historical Archive:</strong> Year {year} is locked. Data is preserved as read-only.
                    </Typography>
                  </Box>
                )}
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={classes.titleText}>Dashboard</Typography>
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
                <Dashboard
                  expenses={expenses.filter(e => String(e.year) === String(year))}
                  income={income.filter(i => String(i.year) === String(year))}
                  categories={categories}
                  year={year}
                  month={month}
                  selMonths={selMonths}
                  setSelMonths={setSelMonths}
                  onEditCategory={row => { setEditRow(row); setModal('category') }}
                />
              </ErrorBoundary>
            )}

            {!loading && !needsSetup && view === 'expenses' && (
              <ErrorBoundary>
                {isLocked && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>🔒</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Historical Archive:</strong> Year {year} is locked. Data is preserved as read-only.
                    </Typography>
                  </Box>
                )}

                {/* Sub-tab switcher */}
                <Box sx={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', p: '3px', mb: '16px', width: 'fit-content' }}>
                  {[{ id: 'expenses', label: 'Expenses' }, { id: 'income', label: 'Income' }].map(tab => (
                    <Button
                      key={tab.id}
                      onClick={() => setTxnTab(tab.id)}
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        px: '14px',
                        py: '5px',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'none',
                        color: txnTab === tab.id ? '#fff' : '#6a7190',
                        background: txnTab === tab.id ? '#5b7fff' : 'transparent',
                        minWidth: 0,
                        '&:hover': {
                          background: txnTab === tab.id ? '#5b7fff' : 'rgba(255,255,255,0.05)',
                        },
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>

                {txnTab === 'expenses' ? (
                  <ExpensesByCategory
                    expenses={expenses.filter(e => String(e.year) === String(year))}
                    income={income.filter(i => String(i.year) === String(year))}
                    categories={categories}
                    year={year}
                    month={month}
                    availableYears={availableYears}
                    onYearChange={setYear}
                    onMonthChange={setMonth}
                    onAddExpense={catId => {
                      setEditRow(catId ? { categoryId: catId } : null)
                      setModal('add-expense')
                    }}
                    onEditExpense={row => { setEditRow(row); setModal('add-expense') }}
                    onDeleteExpense={handleDeleteExpense}
                    onAddCategory={() => { setEditRow(null); setModal('category') }}
                    onEditCategory={row => { setEditRow(row); setModal('category') }}
                    onDeleteCategory={handleDeleteCategory}
                    onReorderCategory={handleReorderCategory}
                    onCopyToNextMonth={handleCopySelected}
                    selectedIds={selectedExpenseIds}
                    onSelectionChange={setSelectedExpenseIds}
                    onBulkPin={handleBulkPin}
                    onBulkDelete={handleBulkDelete}
                    onSaveComment={handleSaveComment}
                    canEdit={authd && !isLocked}
                  />
                ) : (
                  <>
                    <Box className={classes.headerRow}>
                      <Typography variant="h5" className={classes.titleText}>Income</Typography>
                      <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                        <Select value={year} onChange={e => setYear(+e.target.value)} native className={globalClasses.nativeSelect}>
                          {availableYears.map(y => (
                            <option key={y} value={y} style={{ background: '#181b28', color: '#e4e8f5' }}>{y}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" className={globalClasses.nativeSelectFormControl}>
                        <Select value={month} onChange={e => setMonth(+e.target.value)} native className={globalClasses.nativeSelect}>
                          {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1} style={{ background: '#181b28', color: '#e4e8f5' }}>{m}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <Box className={classes.flexFiller} />
                      {authd && !isLocked && (
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
                      income={income.filter(i => String(i.year) === String(year) && String(i.month) === String(month))}
                      onEdit={row => { setEditRow(row); setModal('add-income') }}
                      onDelete={handleDeleteIncome}
                      canEdit={authd && !isLocked}
                    />
                  </>
                )}
              </ErrorBoundary>
            )}

          </>

        )}
      </Box>

      {/* ── Modals ── */}
      {modal === 'add-expense' && (
        <AddExpenseModal
          initial={editRow}
          categories={categories}
          year={year}
          month={month}
          availableYears={availableYears}
          onSave={handleSaveExpense}
          onClose={closeModal}
        />
      )}
      {modal === 'add-income' && (
        <AddIncomeModal
          initial={editRow}
          year={year}
          month={month}
          availableYears={availableYears}
          onSave={handleSaveIncome}
          onClose={closeModal}
        />
      )}
      <CategoryModal
        open={modal === 'category'}
        initial={editRow}
        categories={categories}
        onSave={handleSaveCategory}
        onClose={closeModal}
      />
      {modal === 'export' && (
        <ExportModal categories={categories} onClose={() => setModal(null)} />
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        item={deleteConfirm?.item}
        type={deleteConfirm?.type}
        onDelete={executeDelete}
        onClose={() => setDeleteConfirm(null)}
      />

      <AIInsightsSection
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        expenses={expenses.filter(e => String(e.year) === String(year))}
        income={income.filter(i => String(i.year) === String(year))}
        categories={categories}
        year={year}
        selMonths={selMonths}
        userName={userFullName || userName}
      />
    </Box>
  )
}
