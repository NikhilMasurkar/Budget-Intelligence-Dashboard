import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { getSheetId } from '../api/session'
import { wipeLocalCache } from '../firebase'
import { useOnline, isOffline, clearOfflineData } from '../utils/offline'
import { YEAR_NOW, MONTH_NOW_1 as MONTH_NOW, defaultMonths, isYearLocked } from '../utils/constants'
import { loadDashboard } from '../components/App/lazy'
import { useAuth } from './useAuth'
import { useBudgetData } from './useBudgetData'
import { useExpenses } from './useExpenses'
import { useIncome } from './useIncome'
import { useCategories } from './useCategories'
import { usePushNotifications } from './usePushNotifications'
import { usePinGate } from './usePinGate'
import { useSuggestions } from './useSuggestions'
import { useDeleteConfirm } from './useDeleteConfirm'

const inYear = (rows, year) => rows.filter(r => String(r.year) === String(year))

// Everything the app screen needs: sign-in, PIN, data, the selected
// period and view, which modal is open, and every save/delete handler.
export function useApp() {
  const auth = useAuth()
  const { authd, authReady, userName, handleSignOut } = auth
  const pinGate = usePinGate({ authd, authReady, userName })

  const [view, setView] = useState('dashboard')
  const [year, setYear] = useState(YEAR_NOW)
  const [month, setMonth] = useState(MONTH_NOW)
  const [selMonths, setSelMonths] = useState(() => defaultMonths(YEAR_NOW))
  const [txnTab, setTxnTab] = useState('expenses')
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([])
  const [modal, setModal] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMounted, setAiMounted] = useState(false) // stays true after first open so the close animation runs

  useEffect(() => { setSelMonths(defaultMonths(year)) }, [year])
  useEffect(() => { if (view !== 'expenses') setTxnTab('expenses') }, [view])
  // Fetch the Dashboard chunk alongside the data instead of after it.
  useEffect(() => { if (authd) loadDashboard() }, [authd])
  useEffect(() => { setSelectedExpenseIds([]) }, [year, month, view])

  const signOut = async ({ ask = true } = {}) => {
    if (ask && isOffline() && !window.confirm(
      "You're offline — changes made since you lost connection may not have synced yet and would be lost. Sign out anyway?"
    )) return
    clearOfflineData(getSheetId())   // this account's PIN copy — don't leave it on the phone
    await handleSignOut()
    pinGate.reset()
    // Firestore's on-device copy too. Only when the user chose to sign out: an
    // expired session must not throw away offline changes still waiting to sync.
    if (ask) { await wipeLocalCache(); window.location.reload() }
  }

  const data = useBudgetData({ authd, onUnauthorized: () => signOut({ ask: false }) })
  const { categories, expenses, income, loadAll, setCategories } = data

  const openModal = useCallback((name, row = null) => { setEditRow(row); setModal(name) }, [])
  const closeModal = useCallback(() => { setModal(null); setEditRow(null) }, [])

  const del = useDeleteConfirm({ year, loadAll })
  const { setDeleteConfirm } = del
  const clearSelection = useCallback(() => setSelectedExpenseIds([]), [])
  const expenseActions = useExpenses({ loadAll, year, month, setDeleteConfirm, closeModal, clearSelection })
  const incomeActions = useIncome({ loadAll, setDeleteConfirm, closeModal })
  const categoryActions = useCategories({ loadAll, setDeleteConfirm, setCategories })
  const suggestions = useSuggestions({ expenses, income, categories })
  const push = usePushNotifications(authd)

  const yearExpenses = useMemo(() => inYear(expenses, year), [expenses, year])
  const yearIncome = useMemo(() => inYear(income, year), [income, year])
  const isLocked = isYearLocked(year)

  return {
    ...auth, ...data, ...del, ...expenseActions, ...incomeActions, ...categoryActions, ...suggestions, ...push,
    pinScreen: pinGate.screen,
    offline: !useOnline(),
    view, setView, year, setYear, month, setMonth, selMonths, setSelMonths,
    txnTab, setTxnTab, selectedExpenseIds, setSelectedExpenseIds,
    modal, editRow, openModal, closeModal,
    aiOpen, aiMounted,
    showAI: () => { setAiMounted(true); setAiOpen(true) },
    hideAI: () => setAiOpen(false),
    yearExpenses, yearIncome, isLocked,
    canEdit: authd && !isLocked,
    signOut,
    refresh: () => { loadAll(); toast.success('Refreshing…', { duration: 2000 }) },
  }
}
