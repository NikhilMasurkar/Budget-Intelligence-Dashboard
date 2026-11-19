import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Box, Typography, Button } from '@mui/material'
import { useGlobalStyles } from './styles/globalStyles'
import { useStyles } from './App.styles'
import { getToken, getSheetId, setupSheet, getDriveExcelUrl } from './api/sheets'
import {
  deleteExpense, deleteIncome, readAllExpenseRows, writeAllExpenseRows,
  readAllIncomeRows, writeAllIncomeRows, getWriteToken, requireConnection, usingFirestore,
} from './api/store'
import { deleteCategoryFS } from './api/firestoreCategories'
import { hasPinFS, setPinFS, verifyPinFS, checkPin } from './api/firestoreSettings'
import { wipeLocalCache } from './firebase'
import { useOnline, isOffline, getQueue, clearOfflineData, cachePinHash, getCachedPinHash } from './utils/offline'
import PinScreen from './components/PinScreen'


import { useAuth } from './hooks/useAuth'
import { useBudgetData } from './hooks/useBudgetData'
import { useExpenses } from './hooks/useExpenses'
import { useIncome } from './hooks/useIncome'
import { useCategories } from './hooks/useCategories'

import ExpensesByCategory from './components/Expenses/ExpensesByCategory'
import BalanceSheet from './components/BalanceSheet'
import IncomeTable from './components/Income/IncomeTable'
import AddExpenseModal from './components/Expenses/AddExpenseModal'
import AddIncomeModal from './components/Income/AddIncomeModal'
import ConfigScreen from './components/ConfigScreen'
import SignInScreen from './components/SignInScreen'
import TopBar from './components/TopBar'
import SetupBanner from './components/SetupBanner'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import CategoryModal from './components/Category/CategoryModal'
import ErrorBoundary from './components/ErrorBoundary'
import MonthStepper from './components/MonthStepper'

import { YEAR_NOW, MONTH_NOW_1 as MONTH_NOW, toSentenceCase, defaultMonths, AI_ENABLED, SOURCES, isYearLocked, inLockGrace } from './utils/constants'
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from './api/pushSubscription'
import { investmentCategoryIds } from './utils/money'

// Not needed for first paint: Dashboard pulls chart.js, AI pulls gemini, Export is a modal.
const loadDashboard = () => import('./components/Dashboard')
const Dashboard = lazy(loadDashboard)
const AIInsightsSection = lazy(() => import('./components/Dashboard/subcomponents/AIInsightsSection'))
const ExportModal = lazy(() => import('./components/ExportModal'))
const loadingText = (
  <Typography align="center" sx={{ p: 5, color: '#8891b8' }}>Loading…</Typography>
)

export default function App() {
  const { classes, cx } = useStyles()
  const { classes: globalClasses } = useGlobalStyles()

  // ── Auth first — authd needed by PIN gate effect below ────────
  const { authd, userName, userFullName, userPicture, handleSignIn, handleSignOut, authReady } = useAuth()

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
    const unsent = getQueue(sid).length
    if (ask && unsent && !window.confirm(
      `${unsent} expense${unsent > 1 ? 's' : ''} added offline ${unsent > 1 ? "haven't" : "hasn't"} synced yet and will be lost. Sign out anyway?`
    )) return
    if (ask && usingFirestore() && isOffline() && !window.confirm(
      "You're offline — changes made since you lost connection may not have synced yet and would be lost. Sign out anyway?"
    )) return
    // The saved copy and the queue are this account's data — don't leave them on the phone.
    clearOfflineData(sid)
    await handleSignOut()
    setPinVerified(false)
    setPinMode(null)
    // Firestore's on-device copy too. Only when the user chose to sign out: an
    // expired session must not throw away offline changes still waiting to sync.
    if (ask && usingFirestore()) { await wipeLocalCache(); window.location.reload() }
  }

  const [txnTab, setTxnTab] = useState('expenses')
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMounted, setAiMounted] = useState(false) // stays true after first open so the close animation runs
  const [notifStatus, setNotifStatus] = useState('unsubscribed')

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
  // Fetch the Dashboard chunk alongside the Sheets data instead of after it.
  useEffect(() => { if (authd) loadDashboard() }, [authd])
  useEffect(() => { setSelectedExpenseIds([]) }, [year, month, view])

  const closeModal = useCallback(() => { setModal(null); setEditRow(null) }, [])

  // ── Push notifications ────────────────────────────────────────
  useEffect(() => {
    if (!authd) return
    getPushStatus().then(setNotifStatus).catch(() => { })
  }, [authd])

  const handleToggleNotifications = useCallback(async () => {
    if (notifStatus === 'subscribed') {
      setNotifStatus('loading')
      try {
        await unsubscribeFromPush()
        setNotifStatus('unsubscribed')
        toast.success('Daily reminders disabled')
      } catch {
        // Re-fetch actual state — browser sub may have been revoked even if we threw
        const status = await getPushStatus().catch(() => 'unsubscribed')
        setNotifStatus(status)
      }
    } else {
      setNotifStatus('loading')
      try {
        await subscribeToPush()
        setNotifStatus('subscribed')
        toast.success('Daily 9 PM reminders enabled! 🔔')
      } catch (e) {
        const status = await getPushStatus().catch(() => 'unsubscribed')
        setNotifStatus(status)
        if (!e?.message?.includes('denied')) toast.error(e?.message || String(e))
      }
    }
  }, [notifStatus])

  // ── Data ──────────────────────────────────────────────────────
  const {
    categories, expenses, income, loading, didInitialLoad, needsSetup, availableYears,
    loadAll, autoSyncToDrive, setCategories, setNeedsSetup, missingConfig,
    offlineSince, pendingCount, queueOffline, dbMode
  } = useBudgetData({ authd, userName, onUnauthorized: () => handleSignOutFull({ ask: false }) })

  // ── Offline ───────────────────────────────────────────────────
  // offlineSince is set while the phone's saved copy is on screen — also when
  // the browser claims to be online but requests are failing.
  const online = useOnline()
  const offline = !online || !!offlineSince
  // Signing in to Google needs the network, so offline the saved copy stands in.
  const showData = authd || !!offlineSince
  // Firestore keeps every change offline and syncs it later; the Sheet can
  // only queue new expenses.
  const fullyOffline = dbMode === 'firestore'
  const canWrite = !offline || fullyOffline

  // ── CRUD hooks ────────────────────────────────────────────────
  const { handleSaveExpense, handleDeleteExpense, handleCopySelected, handleBulkPin, handleBulkDelete, handleSaveComment } = useExpenses({
    loadAll, autoSyncToDrive, year, month, setDeleteConfirm, closeModal,
    clearSelection: () => setSelectedExpenseIds([]),
    queueOffline,
  })
  const { handleSaveIncome, handleDeleteIncome } = useIncome({
    loadAll, autoSyncToDrive, setDeleteConfirm, closeModal
  })
  const { handleSaveCategory, handleDeleteCategory, handleReorderCategory } = useCategories({
    loadAll, autoSyncToDrive, setDeleteConfirm, setCategories
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

  const investmentHoldings = useMemo(() => {
    const investIds = investmentCategoryIds(categories)
    const byName = new Map()
    expenses.forEach(e => {
      if (!investIds.has(e.categoryId)) return
      const name = e.itemName || 'Unnamed'
      byName.set(name, (byName.get(name) || 0) + (+e.amount || 0))
    })
    return [...byName.entries()]
      .map(([name, balance]) => ({ name, balance }))
      .filter(h => h.balance > 0)
      .sort((a, b) => b.balance - a.balance)
  }, [expenses, categories])

  // Past item names for the Add Expense suggestions, newest use first, each
  // remembering the category it was last filed under. Withdrawals (negative
  // rows) are skipped — their names come from the holdings dropdown.
  const itemSuggestions = useMemo(() => {
    const byName = new Map()
    // reverse() first so, within one month, the later sheet row wins (sort is stable).
    const newestFirst = [...expenses].reverse().sort((a, b) => (b.year - a.year) || (b.month - a.month))
    newestFirst.forEach(e => {
      const name = String(e.itemName || '').trim()
      const key = name.toLowerCase()
      if (!name || +e.amount < 0 || byName.has(key)) return
      byName.set(key, { name, categoryId: e.categoryId })
    })
    return [...byName.values()]
  }, [expenses])

  // Past custom income sources (not the built-in dropdown ones) for the Custom Source box.
  const sourceSuggestions = useMemo(() => {
    const builtIn = new Set(SOURCES.map(s => s.toLowerCase()))
    const byKey = new Map()
    income.forEach(i => {
      const name = String(i.source || '').trim()
      const key = name.toLowerCase()
      if (name && !builtIn.has(key) && !byKey.has(key)) byKey.set(key, name)
    })
    return [...byKey.values()]
  }, [income])

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
    try { requireConnection() } catch { return }
    const t = getWriteToken()
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
      <Toaster position="top-right" toastOptions={{ style: { background: '#101218', color: '#e4e8f5', border: '1px solid rgba(255,255,255,0.13)' } }} />

      <TopBar
        view={view}
        setView={setView}
        authd={showData}
        loading={loading}
        userName={userName}
        userPicture={userPicture}
        onRefresh={() => { loadAll(); toast.success('Refreshing data from Google Sheets…', { duration: 2000 }) }}
        onOpenDrive={handleOpenDrive}
        onExportLocal={() => setModal('export')}
        onSignIn={handleSignIn}
        onSignOut={handleSignOutFull}
        onAIInsights={() => { setAiMounted(true); setAiOpen(true) }}
        hasAIKey={AI_ENABLED}
        notifStatus={notifStatus}
        onToggleNotifications={handleToggleNotifications}
        onAddExpense={showData && didInitialLoad && !needsSetup && !isLocked ? () => handleAddExpense(null) : undefined}
      />

      <Box className={globalClasses.contentArea}>
        {!showData ? (
          <SignInScreen onSignIn={handleSignIn} />
        ) : (
          <>
            {(offline || pendingCount > 0) && (
              <Box className={classes.lockedBanner} role="status">
                <span style={{ marginRight: '8px', fontSize: '16px' }}>{offline ? '📴' : '⏳'}</span>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {offline && (
                    <>
                      <strong>Offline</strong>
                      {fullyOffline
                        ? <> — everything still works. Changes are saved on this phone and sync by themselves when you're back online.</>
                        : <>
                            {offlineSince && <> — showing your data from {new Date(offlineSince).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</>}
                            . You can add expenses; other changes need a connection.
                          </>}
                    </>
                  )}
                  {pendingCount > 0 && (
                    <> {offline ? ' ' : ''}<strong>{pendingCount} expense{pendingCount > 1 ? 's' : ''} waiting to sync</strong>
                      {offline ? ' when you\'re back online.' : authd ? ' — sending now…' : ' — sign in to send.'}</>
                  )}
                </Typography>
              </Box>
            )}

            {/* Full-screen loading only on the very first load — after that, keep
                content mounted so the UI doesn't blank out on every save/refresh. */}
            {loading && !didInitialLoad && (
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

            {didInitialLoad && !needsSetup && view === 'dashboard' && (
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

            {didInitialLoad && !needsSetup && view === 'balance' && (
              <ErrorBoundary>
                <BalanceSheet
                  allExpenses={expenses}
                  allIncome={income}
                  categories={categories}
                />
              </ErrorBoundary>
            )}

            {didInitialLoad && !needsSetup && view === 'expenses' && (
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
                    // Adding always works offline; other row changes need a
                    // connection unless the data is in Firestore.
                    canEdit={showData && !isLocked}
                    online={canWrite}
                  />
                ) : (
                  <>
                    <Box className={classes.headerRow}>
                      <Typography variant="h5" className={classes.titleText}>Income</Typography>
                      <MonthStepper year={year} month={month} availableYears={availableYears}
                        onYearChange={setYear} onMonthChange={setMonth} />
                      <Box className={classes.flexFiller} />
                      {showData && !isLocked && canWrite && (
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
                      canEdit={showData && !isLocked && canWrite}
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
