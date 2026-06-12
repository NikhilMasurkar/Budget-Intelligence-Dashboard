import React, { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Box, Typography, Button, FormControl, Select } from '@mui/material'
import { useGlobalStyles } from './styles/globalStyles'
import { useStyles } from './App.styles'
import {
  deleteExpense, deleteIncome, deleteCategory,
  readAllExpenseRows, writeAllExpenseRows,
  readAllIncomeRows, writeAllIncomeRows,
  getToken, setupSheet, getSpreadsheetUrl
} from './api/sheets'


import { useAuth } from './hooks/useAuth'
import { useBudgetData } from './hooks/useBudgetData'
import { useExpenses } from './hooks/useExpenses'
import { useIncome } from './hooks/useIncome'
import { useCategories } from './hooks/useCategories'

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
import ErrorBoundary from './components/ErrorBoundary'

import { MONTHS, YEAR_NOW, MONTH_NOW_1 as MONTH_NOW, toSentenceCase } from './utils/constants'

export default function App() {
  const { classes, cx } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()

  // ── UI state ──────────────────────────────────────────────────
  const [view, setView] = useState('dashboard')
  const [year, setYear] = useState(YEAR_NOW)
  const [month, setMonth] = useState(MONTH_NOW)
  const [dashFilterMonth, setDashFilterMonth] = useState(null)
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const isLocked = parseInt(year) < new Date().getFullYear()

  useEffect(() => { setSelectedExpenseIds([]) }, [year, month, view])

  const closeModal = useCallback(() => { setModal(null); setEditRow(null) }, [])

  // ── Auth ──────────────────────────────────────────────────────
  const { authd, userName, userPicture, handleSignIn, handleSignOut } = useAuth()

  // ── Data ──────────────────────────────────────────────────────
  const {
    categories, expenses, income, loading, needsSetup, availableYears,
    loadAll, autoSyncToDrive, setCategories, setNeedsSetup, missingConfig
  } = useBudgetData({ authd, userName, onUnauthorized: handleSignOut })

  // ── CRUD hooks ────────────────────────────────────────────────
  const { handleSaveExpense, handleFieldUpdate, handleDeleteExpense, handleCopySelected } = useExpenses({
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

  // ── Open spreadsheet ──────────────────────────────────────────
  const handleOpenDrive = async () => {
    const t = getToken()
    if (!t) { toast.error('Sign in to open spreadsheet'); return }
    try {
      toast.loading('Finding your spreadsheet…', { id: 'open-drive' })
      const url = await getSpreadsheetUrl(t, userName)
      toast.dismiss('open-drive')
      if (!url) { toast.error('No spreadsheet found yet — add some data first'); return }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error('Could not open spreadsheet: ' + e.message, { id: 'open-drive' })
    }
  }

  // ── Config check ──────────────────────────────────────────────
  if (missingConfig) return <ConfigScreen />

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
                  filterMonth={dashFilterMonth}
                  onMonthChange={m => { setMonth(m); setDashFilterMonth(m) }}
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
                <Box className={classes.headerRow}>
                  <Typography variant="h5" className={classes.titleText}>Expenses</Typography>
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
                    <Box className={classes.actionButtonsContainer}>
                      {selectedExpenseIds.length > 0 && (
                        <Button
                          variant="contained"
                          onClick={() => handleCopySelected(selectedExpenseIds)}
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
                  expenses={expenses.filter(e => String(e.year) === String(year) && String(e.month) === String(month))}
                  categories={categories}
                  onEdit={row => { setEditRow(row); setModal('add-expense') }}
                  onDelete={handleDeleteExpense}
                  canEdit={authd && !isLocked}
                  selectedIds={selectedExpenseIds}
                  onSelectionChange={setSelectedExpenseIds}
                />
              </ErrorBoundary>
            )}

            {!loading && !needsSetup && view === 'income' && (
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
              </ErrorBoundary>
            )}

            {!loading && !needsSetup && view === 'categories' && (
              <ErrorBoundary>
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
    </Box>
  )
}
