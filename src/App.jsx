import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Box, Typography, Button } from '@mui/material'
import { useGlobalStyles } from './styles/globalStyles'
import { useStyles } from './App.styles'
import { getSheetId } from './api/session'
import {
  deleteExpense, deleteIncome, readAllExpenseRows, writeAllExpenseRows,
  readAllIncomeRows, writeAllIncomeRows,
} from './api/store'
import { deleteCategoryFS } from './api/firestoreCategories'
import { hasPinFS, setPinFS, verifyPinFS, checkPin } from './api/firestoreSettings'
import { wipeLocalCache } from './firebase'
import { useOnline, isOffline, clearOfflineData, cachePinHash, getCachedPinHash } from './utils/offline'
import PinScreen from './components/PinScreen'


import { useAuth } from './hooks/useAuth'
import { useBudgetData } from './hooks/useBudgetData'
import { useExpenses } from './hooks/useExpenses'
import { useIncome } from './hooks/useIncome'
import { useCategories } from './hooks/useCategories'
import { usePushNotifications } from './hooks/usePushNotifications'
import { useSuggestions } from './hooks/useSuggestions'

import ExpensesByCategory from './components/Expenses/ExpensesByCategory'
import BalanceSheet from './components/BalanceSheet'
import IncomeTable from './components/Income/IncomeTable'
import AddExpenseModal from './components/Expenses/AddExpenseModal'
import AddIncomeModal from './components/Income/AddIncomeModal'
import ConfigScreen from './components/ConfigScreen'
import SignInScreen from './components/SignInScreen'
import TopBar from './components/TopBar'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import CategoryModal from './components/Category/CategoryModal'
import ErrorBoundary from './components/ErrorBoundary'
import MonthStepper from './components/MonthStepper'

import { YEAR_NOW, MONTH_NOW_1 as MONTH_NOW, toSentenceCase, defaultMonths, AI_ENABLED, isYearLocked, inLockGrace } from './utils/constants'

// Not needed for first paint: Dashboard pulls chart.js, AI pulls gemini, Export is a modal.
const loadDashboard = () => import('./components/Dashboard')
const Dashboard = lazy(loadDashboard)
const AIInsightsSection = lazy(() => import('./components/Dashboard/subcomponents/AIInsightsSection'))
const ExportModal = lazy(() => import('./components/ExportModal'))
const loadingText = (
  <Typography align="center" sx={{ p: 5, color: 'var(--text2)' }}>Loading…</Typography>
)

export default function App() {
  const { classes, cx } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()

  // ── Auth first — authd needed by PIN gate effect below ────────
  const { authd, checking, userName, userFullName, userPicture, handleSignIn, handleSignOut, authReady } = useAuth()

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

  // signOut() clears the storage flags, but pinVerified/pinMode are React state
  // and would survive — letting a second account sign in with the PIN gate
  // already "passed". Always reset them alongside the sign-out.
  const handleSignOutFull = async ({ ask = true } = {}) => {
    const sid = getSheetId()
    if (ask && isOffline() && !window.confirm(
      "You're offline — changes made since you lost connection may not have synced yet and would be lost. Sign out anyway?"
    )) return
    // This account's PIN copy — don't leave it on the phone.
    clearOfflineData(sid)
    await handleSignOut()
    setPinVerified(false)
    setPinMode(null)
    // Firestore's on-device copy too. Only when the user chose to sign out: an
    // expired session must not throw away offline changes still waiting to sync.
    if (ask) { await wipeLocalCache(); window.location.reload() }
  }

  const [txnTab, setTxnTab] = useState('expenses')
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMounted, setAiMounted] = useState(false) // stays true after first open so the close animation runs

  const isLocked = isYearLocked(year)

  // Reset selMonths when year changes
  useEffect(() => { setSelMonths(defaultMonths(year)) }, [year])

  // ── PIN gate ──────────────────────────────────────────────────
  useEffect(() => {
    if (pinVerified) return
    const sid = getSheetId()
    if (!sid) return
    if (localStorage.getItem('budgetiq_has_pin') === '1') { setPinMode('entry'); return }
    if (!authd) return
    hasPinFS(sid).then(exists => {
      if (exists) localStorage.setItem('budgetiq_has_pin', '1')
      setPinMode(exists ? 'entry' : 'setup')
    }).catch(() => {
      // Firebase error — skip PIN gate rather than block the app
      setPinVerified(true)
    })
  }, [authd, pinVerified])

  useEffect(() => { if (view !== 'expenses') setTxnTab('expenses') }, [view])
  // Fetch the Dashboard chunk alongside the data instead of after it.
  useEffect(() => { if (authd) loadDashboard() }, [authd])
  useEffect(() => { setSelectedExpenseIds([]) }, [year, month, view])

  const closeModal = useCallback(() => { setModal(null); setEditRow(null) }, [])

  const { notifStatus, handleToggleNotifications } = usePushNotifications(authd)

  // ── Data ──────────────────────────────────────────────────────
  const {
    categories, expenses, income, loading, didInitialLoad, availableYears,
    loadAll, setCategories, missingConfig,
  } = useBudgetData({ authd, onUnauthorized: () => handleSignOutFull({ ask: false }) })

  // Firestore keeps every change made offline and syncs it later.
  const offline = !useOnline()
  const showData = authd

  // ── CRUD hooks ────────────────────────────────────────────────
  const { handleSaveExpense, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment } = useExpenses({
    loadAll, year, month, setDeleteConfirm, closeModal,
    clearSelection: () => setSelectedExpenseIds([]),
  })
  const { handleSaveIncome, handleDeleteIncome } = useIncome({
    loadAll, setDeleteConfirm, closeModal
  })
  const { handleSaveCategory, handleDeleteCategory, handleReorderCategory } = useCategories({
    loadAll, setDeleteConfirm, setCategories
  })

  // ── Stable callbacks for ExpensesByCategory (prevent unnecessary re-renders) ──
  const handleAddExpense = useCallback((catId) => {
    setEditRow(catId ? { categoryId: catId } : null)
    setModal('add-expense')
  }, [])
  const handleEditExpense = useCallback((row) => {
    setEditRow(row)
    setModal('add-expense')
  }, [])
  const handleAddCategory = useCallback(() => {
    setEditRow(null)
    setModal('category')
  }, [])
  const handleEditCategory = useCallback((row) => {
    setEditRow(row)
    setModal('category')
  }, [])

  const { investmentHoldings, itemSuggestions, sourceSuggestions } = useSuggestions({ expenses, income, categories })

  // Year-filtered slices — stable reference when data/year hasn't changed.
  const yearExpenses = useMemo(
    () => expenses.filter(e => String(e.year) === String(year)),
    [expenses, year]
  )
  const yearIncome = useMemo(
    () => income.filter(i => String(i.year) === String(year)),
    [income, year]
  )

  // ── Delete dispatch ───────────────────────────────────────────
  const executeDelete = async (scope) => {
    const { type, item } = deleteConfirm
    const targetYear = parseInt(item?.year || year)
    if (type !== 'category' && targetYear && isYearLocked(targetYear)) {
      toast.error('Cannot modify historical data: Year is locked.')
      return
    }
    try {
      if (type === 'expense') {
        if (scope === 'month') {
          await deleteExpense(item.id)
          toast.success('Deleted from this month')
        } else {
          toast.loading('Deleting from all months...', { id: 'del-all' })
          const allRows = await readAllExpenseRows()
          const filtered = allRows.filter(r =>
            !(toSentenceCase(r[4]) === toSentenceCase(item.itemName) &&
              r[3] === item.categoryId && String(r[1]) === String(item.year))
          )
          await writeAllExpenseRows(filtered)
          toast.success('Deleted from all months!', { id: 'del-all' })
        }
      } else if (type === 'income') {
        if (scope === 'month') {
          await deleteIncome(item.id)
          toast.success('Deleted from this month')
        } else {
          toast.loading('Deleting from all months...', { id: 'del-all' })
          const allRows = await readAllIncomeRows()
          const filtered = allRows.filter(r =>
            !(toSentenceCase(r[3]) === toSentenceCase(item.source) && String(r[1]) === String(item.year))
          )
          await writeAllIncomeRows(filtered)
          toast.success('Deleted from all months!', { id: 'del-all' })
        }
      } else if (type === 'category') {
        const sid = getSheetId()
        await deleteCategoryFS(sid, item.id)
        toast.success('Deleted')
      }
      setDeleteConfirm(null)
      loadAll()
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  // ── Config check ──────────────────────────────────────────────
  if (missingConfig) return <ConfigScreen />

  // ── PIN gate ──────────────────────────────────────────────────
  if (!pinVerified && pinMode) {
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
        onSetPin={async (pin) => {
          const hash = await setPinFS(sid, pin)
          localStorage.setItem('budgetiq_has_pin', '1')
          cachePinHash(sid, hash)
        }}
        onVerify={async (enteredPin) => {
          if (pinMode === 'setup') return true
          if (enteredPin === null) return true            // biometric bypass
          // Firestore is out of reach offline — check against the copy kept
          // from the last time this PIN was confirmed online.
          if (isOffline()) {
            const cached = getCachedPinHash(sid)
            if (!cached) {
              toast.error("You're offline. Use fingerprint / Face ID, or connect once so your PIN works offline.", { id: 'pin-offline' })
              return false
            }
            return checkPin(enteredPin, cached)
          }
          await authReady()
          const hash = await verifyPinFS(sid, enteredPin)
          if (hash) cachePinHash(sid, hash)
          return !!hash
        }}
        onUnlock={unlock}
      />
    )
  }

  return (
    <Box className={globalClasses.globalContainer}>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg)', color: 'var(--text)', border: '1px solid rgb(var(--ink-rgb) / 0.13)' } }} />

      <TopBar
        view={view}
        setView={setView}
        authd={showData}
        loading={loading}
        userName={userName}
        userPicture={userPicture}
        onRefresh={() => { loadAll(); toast.success('Refreshing…', { duration: 2000 }) }}
        onExportLocal={() => setModal('export')}
        onSignIn={checking ? undefined : handleSignIn}
        onSignOut={handleSignOutFull}
        onAIInsights={() => { setAiMounted(true); setAiOpen(true) }}
        hasAIKey={AI_ENABLED}
        notifStatus={notifStatus}
        onToggleNotifications={handleToggleNotifications}
        onAddExpense={showData && didInitialLoad && !isLocked ? () => handleAddExpense(null) : undefined}
      />

      <Box className={globalClasses.contentArea}>
        {!showData && checking ? loadingText : !showData ? (
          <SignInScreen onSignIn={handleSignIn} />
        ) : (
          <>
            {offline && (
              <Box className={classes.lockedBanner} role="status">
                <span style={{ marginRight: '8px', fontSize: '16px' }}>📴</span>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  <strong>Offline</strong> — everything still works. Changes are saved on this phone and sync by themselves when you're back online.
                </Typography>
              </Box>
            )}

            {/* Full-screen loading only on the very first load — after that, keep
                content mounted so the UI doesn't blank out on every save/refresh. */}
            {loading && !didInitialLoad && (
              <Typography align="center" sx={{ p: 5, color: 'var(--text2)' }}>
                Loading your budget…
              </Typography>
            )}

            {didInitialLoad && view === 'dashboard' && (
              <ErrorBoundary>
                {isLocked && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>🔒</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Historical Archive:</strong> Year {year} is locked. Data is preserved as read-only.
                    </Typography>
                  </Box>
                )}
                {inLockGrace(year) && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>⏳</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Year {year} is still editable until 31 Jan for late entries, then it locks.
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
                <Suspense fallback={loadingText}>
                  <Dashboard
                    expenses={yearExpenses}
                    income={yearIncome}
                    // Full history: investment balances carry forward, so a pot's
                    // true balance is not derivable from one year alone.
                    allExpenses={expenses}
                    categories={categories}
                    year={year}
                    month={month}
                    selMonths={selMonths}
                    setSelMonths={setSelMonths}
                    onEditCategory={row => { setEditRow(row); setModal('category') }}
                  />
                </Suspense>
              </ErrorBoundary>
            )}

            {didInitialLoad && view === 'balance' && (
              <ErrorBoundary>
                <BalanceSheet
                  allExpenses={expenses}
                  allIncome={income}
                  categories={categories}
                />
              </ErrorBoundary>
            )}

            {didInitialLoad && view === 'expenses' && (
              <ErrorBoundary>
                {isLocked && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>🔒</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Historical Archive:</strong> Year {year} is locked. Data is preserved as read-only.
                    </Typography>
                  </Box>
                )}
                {inLockGrace(year) && (
                  <Box className={classes.lockedBanner}>
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>⏳</span>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Year {year} is still editable until 31 Jan for late entries, then it locks.
                    </Typography>
                  </Box>
                )}

                {/* Sub-tab switcher */}
                <Box sx={{ display: 'flex', gap: '3px', background: 'rgb(var(--ink-rgb) / 0.04)', borderRadius: '10px', p: '3px', mb: '16px', width: 'fit-content' }}>
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
                        color: txnTab === tab.id ? '#fff' : 'var(--text-muted)',
                        background: txnTab === tab.id ? 'var(--accent)' : 'transparent',
                        minWidth: 0,
                        '&:hover': {
                          background: txnTab === tab.id ? 'var(--accent)' : 'rgb(var(--ink-rgb) / 0.05)',
                        },
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>

                {txnTab === 'expenses' ? (
                  <ExpensesByCategory
                    expenses={yearExpenses}
                    income={yearIncome}
                    categories={categories}
                    year={year}
                    month={month}
                    availableYears={availableYears}
                    onYearChange={setYear}
                    onMonthChange={setMonth}
                    onAddExpense={handleAddExpense}
                    onEditExpense={handleEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onAddCategory={handleAddCategory}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onReorderCategory={handleReorderCategory}
                    onCopyToNextMonth={handleCopySelected}
                    selectedIds={selectedExpenseIds}
                    onSelectionChange={setSelectedExpenseIds}
                    onBulkPin={handleBulkPin}
                    onBulkDelete={handleBulkDelete}
                    onSaveComment={handleSaveComment}
                    canEdit={showData && !isLocked}
                  />
                ) : (
                  <>
                    <Box className={classes.headerRow}>
                      <Typography variant="h5" className={classes.titleText}>Income</Typography>
                      <MonthStepper year={year} month={month} availableYears={availableYears}
                        onYearChange={setYear} onMonthChange={setMonth} />
                      <Box className={classes.flexFiller} />
                      {showData && !isLocked && (
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
                      canEdit={showData && !isLocked}
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
          holdings={investmentHoldings}
          suggestions={itemSuggestions}
          expenses={expenses}
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
          suggestions={sourceSuggestions}
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
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ExportModal categories={categories} onClose={() => setModal(null)} />
          </Suspense>
        </ErrorBoundary>
      )}

      <DeleteConfirmModal
        open={!!deleteConfirm}
        item={deleteConfirm?.item}
        type={deleteConfirm?.type}
        onDelete={executeDelete}
        onClose={() => setDeleteConfirm(null)}
      />

      {aiMounted && (
        <ErrorBoundary>
        <Suspense fallback={null}>
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
        </Suspense>
        </ErrorBoundary>
      )}
    </Box>
  )
}
