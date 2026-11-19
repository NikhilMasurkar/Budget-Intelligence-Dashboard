import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import * as sheets from '../api/sheets'
import {
  fetchCategories, getToken, getSheetId, signOut,
  DEFAULT_CATEGORIES, downloadExcelFromDrive, uploadExcelToDrive, uid, TABS
} from '../api/sheets'
import {
  fetchExpenses, fetchIncome,
  readAllExpenseRows, writeAllExpenseRows, readAllIncomeRows, writeAllIncomeRows,
  autoFixedCopyToMonth, appendRows, forgetCachedTab,
  resolveDbMode, usingFirestore, getDbSettings, setDbMode,
} from '../api/store'
import { migrateToFirestore } from '../api/migrate'
import {
  isOffline, isNetworkError, saveSnapshot, loadSnapshot,
  getQueue, setQueue, queueRow, rowToExpense
} from '../utils/offline'
import {
  fetchCategoriesFS, saveAllCategoriesFS
} from '../api/firestoreCategories'
import { fetchExpenseMetaFS, expensePinKey, setExpenseMetaFS } from '../api/firestoreExpenseMeta'
import { getSheetSyncMetaFS, setSheetFormatVersionFS } from '../api/firestoreSettings'
import { YEAR_NOW, SHEET_FORMAT_VERSION, toSentenceCase } from '../utils/constants'
import { reconcileExpenses, reconcileIncome } from '../utils/reconcile'

export function useBudgetData({ authd, userName, onUnauthorized }) {
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [availableYears, setAvailableYears] = useState([YEAR_NOW])
  const [didInitialLoad, setDidInitialLoad] = useState(false)
  // Set while showing the phone's saved copy: when that copy was taken.
  const [offlineSince, setOfflineSince] = useState(null)
  const [pendingCount, setPendingCount] = useState(() => getQueue(getSheetId()).length)
  const [dbMode, setDbModeState] = useState('sheets')

  const missingConfig = !import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ||
    !import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    !import.meta.env.VITE_FIREBASE_PROJECT_ID

  // Expenses added offline, shown in the list until they reach the sheet.
  const pendingExpenses = (sid) => getQueue(sid).map(r => rowToExpense(r, { pending: true }))

  // Show the last data that loaded successfully. False when there is none.
  const showSnapshot = (sid) => {
    const snap = loadSnapshot(sid)
    if (!snap) return false
    setCategories(snap.categories || [])
    setExpenses([...(snap.expenses || []), ...pendingExpenses(sid)])
    setIncome(snap.income || [])
    if (snap.availableYears?.length) setAvailableYears(snap.availableYears)
    setOfflineSince(snap.savedAt)
    setPendingCount(getQueue(sid).length)
    setDidInitialLoad(true)
    return true
  }

  // Send queued offline expenses to the sheet. Reads the sheet fresh first and
  // skips ids already there, so a connection that dropped mid-send can't
  // duplicate a row. Only rows that were queued when this started are removed.
  const syncingRef = useRef(false)
  const syncQueue = async (sid, t) => {
    const queued = getQueue(sid)
    if (!queued.length || !t || syncingRef.current) return 0
    syncingRef.current = true
    try {
      forgetCachedTab(TABS.EXPENSES)
      const inSheet = new Set((await readAllExpenseRows(t)).map(r => r[0]))
      const toSend = queued.filter(r => !inSheet.has(r[0]))
      if (toSend.length) await appendRows(TABS.EXPENSES, toSend, t)
      const sent = new Set(queued.map(r => r[0]))
      setQueue(sid, getQueue(sid).filter(r => !sent.has(r[0])))
      setPendingCount(getQueue(sid).length)
      // Pins and notes also live in Firestore (the Excel backup drops them).
      if (!usingFirestore()) await Promise.all(toSend.map(r => setExpenseMetaFS(sid,
        { year: r[1], month: r[2], categoryId: r[3], itemName: r[4] },
        { isFixed: r[6], note: r[7] }).catch(() => {})))
      toast.success(`Synced ${queued.length} expense${queued.length > 1 ? 's' : ''} added offline ✓`, { duration: 4000 })
      return queued.length
    } finally {
      syncingRef.current = false
    }
  }

  const loadAll = useCallback(async (opts = {}) => {
    if (missingConfig) return
    const t = getToken()
    const sid = getSheetId()
    if (!sid) { setCategories([]); setExpenses([]); setIncome([]); return }
    const mode = await resolveDbMode(sid)
    setDbModeState(mode)
    const fsMode = mode === 'firestore'
    // Sheet mode, no connection: show the saved copy. Firestore mode reads its
    // own offline cache instead, which also holds changes made offline.
    // (Online without a token is a lapsed sign-in — fall through to the sign-in
    // screen as before, not stale data.)
    if (!fsMode && isOffline() && showSnapshot(sid)) return
    if (!t && !(fsMode && isOffline())) { setCategories([]); setExpenses([]); setIncome([]); return }
    setLoading(true)
    setNeedsSetup(false)
    try {
      let synced = 0
      try { synced = await syncQueue(sid, t || 'firestore') } catch (e) {
        if (!isNetworkError(e)) toast.error('Could not sync offline expenses yet: ' + e.message)
        else throw e
      }

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

      // ── Expenses + Income ─────────────────────────────────────────────────
      // Firestore mode: read the months. Sheet mode: the Sheet, reconciled
      // against the Drive Excel (which Firestore mode only ever writes).
      let xlsxExps = [], xlsxInc = [], xlsxOk = false
      if (!opts.skipExcel && !usingFirestore()) {
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

        // Reconcile the Drive Excel backup against the Sheet DB (pure + tested).
        const { rows: reconciledExpenses, changed: expensesChanged } =
          reconcileExpenses(xlsxExps, dbExpRows, uid)
        if (expensesChanged) await writeAllExpenseRows(reconciledExpenses, t)

        const { rows: reconciledIncome, changed: incomeChanged } =
          reconcileIncome(xlsxInc, dbIncRows, uid)
        if (incomeChanged) await writeAllIncomeRows(reconciledIncome, t)

        rawExps = reconciledExpenses.map(r => ({
          id: r[0], year: r[1], month: r[2], categoryId: r[3],
          itemName: r[4], amount: r[5], isFixed: r[6], note: r[7], updatedAt: r[8]
        }))
        rawInc = reconciledIncome.map(r => ({
          id: r[0], year: r[1], month: r[2], source: r[3], amount: r[4], date: r[5] || ''
        }))
      } else {
        rawExps = await fetchExpenses(null, t)
        rawInc = await fetchIncome(null, t)
      }

      // One-time move to Firestore, now that the Sheet is fully up to date.
      // Only switches when the copy checks out; otherwise nothing changes.
      if (!usingFirestore() && t && !isOffline() && await migrateToFirestore(sid, t)) {
        setDbModeState('firestore')
        rawExps = await fetchExpenses(null, t)
        rawInc = await fetchIncome(null, t)
      }

      let exps = rawExps.map(e => ({ ...e, itemName: toSentenceCase(e.itemName) }))
      const inc = rawInc.map(i => ({ ...i, source: toSentenceCase(i.source) }))

      // ── App-only metadata overlay ────────────────────────────────────────
      // The Excel backup can't store isFixed (and mangles notes), so Firestore
      // is the authority for the PIN — re-apply it on every load.
      //
      // The note/comment thread is different: it lives in Sheet column H, which
      // IS preserved through the Sheet↔Excel reconciliation (kept as existing[7]).
      // That live Sheet value must win — Firestore is only a FALLBACK to restore
      // comments if the Sheet copy is ever lost. Letting a stale/empty Firestore
      // note overwrite the Sheet's was wiping comments from the UI even though
      // they were still visible in the Sheet.
      // (Firestore mode stores pins and comments on the expense itself.)
      const metaMap = usingFirestore() ? {} : await fetchExpenseMetaFS(sid)
      if (Object.keys(metaMap).length) {
        exps = exps.map(e => {
          const m = metaMap[expensePinKey(e)]
          if (!m) return e
          const next = { ...e }
          if ('isFixed' in m) next.isFixed = m.isFixed ? 'TRUE' : 'FALSE'
          // Keep the Sheet's note; only fall back to Firestore when it's empty.
          if (!next.note && 'note' in m && m.note) next.note = m.note
          return next
        })
      }

      // Anything still queued (a sync that failed) stays visible as pending.
      setExpenses([...exps, ...pendingExpenses(sid)])
      setIncome(inc)

      const systemYear = new Date().getFullYear()
      const years = new Set([systemYear])
      exps.forEach(e => { if (e.year) years.add(parseInt(e.year)) })
      inc.forEach(i => { if (i.year) years.add(parseInt(i.year)) })
      const filteredYears = Array.from(years)
        .filter(y => y <= systemYear || exps.some(e => parseInt(e.year) === y) || inc.some(i => parseInt(i.year) === y))
        .sort((a, b) => a - b)
      setAvailableYears(filteredYears)
      // In Firestore mode an offline load is live local data, not an old copy;
      // offlineSince just marks that it's being shown without a connection.
      setOfflineSince(usingFirestore() && isOffline() ? Date.now() : null)
      if (!usingFirestore()) saveSnapshot(sid, { categories: cats, expenses: exps, income: inc, availableYears: filteredYears })
      if (synced) autoSyncToDrive()

    } catch (e) {
      if (isNetworkError(e) && !usingFirestore() && showSnapshot(sid)) {
        // Lost the connection — the saved copy is on screen.
      } else if (isNetworkError(e)) {
        toast.error("You're offline, and there's no saved copy on this phone yet. Connect once to load your data.")
      } else if (e.message.includes('Unable to parse range')) {
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
      setDidInitialLoad(true)
    }
  }, [missingConfig, userName, authd])

  useEffect(() => { loadAll() }, [loadAll])

  // Back online: reload, which sends anything queued first. If Google sign-in
  // lapsed meanwhile, useAuth re-signs in and its authd change reloads instead.
  useEffect(() => {
    // Firestore mode: changes made offline have synced by themselves; refresh
    // the Sheet/Excel copies too.
    const onOnline = () => { if (getToken()) { loadAll(); if (usingFirestore()) autoSyncToDrive() } }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [loadAll])

  // Save a NEW expense on the phone (offline, or the request never got through)
  // and show it straight away as pending.
  const queueOffline = useCallback((row) => {
    const sid = getSheetId()
    queueRow(sid, row)
    setExpenses(prev => [...prev, rowToExpense(row, { pending: true })])
    setPendingCount(getQueue(sid).length)
  }, [])


  // Auto-copy fixed expenses once per calendar month. Waits for the first load
  // so it writes to whichever store that load settled on (and never races the
  // one-time move to Firestore).
  useEffect(() => {
    if (!authd || !didInitialLoad) return
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
  }, [authd, didInitialLoad]) // eslint-disable-line react-hooks/exhaustive-deps

  // Regenerate the Drive Excel from the current Sheet data + current export code.
  // Returns true when it completes without error (including the "no data yet"
  // case — nothing to back up is not a failure), false if the upload errored.
  const _syncToDriveNow = useCallback(async () => {
    const t = getToken()
    const sid = getSheetId()
    if (!t || !sid) return false
    try {
      let [allExpRows, allIncRows, freshCats] = await Promise.all([
        readAllExpenseRows(t),
        readAllIncomeRows(t),
        fetchCategoriesFS(sid)          // use Firestore, not the Sheet tab
      ])
      if (usingFirestore()) allExpRows = await mirrorToSheet(sid, t, allExpRows, allIncRows)
      const toObjs = (rows, fields) => rows.map(r => {
        const obj = {}; fields.forEach((f, i) => obj[f] = r[i]); return obj
      })
      const exps = toObjs(allExpRows, ['id', 'year', 'month', 'categoryId', 'itemName', 'amount', 'isFixed', 'note'])
      const incs = toObjs(allIncRows, ['id', 'year', 'month', 'source', 'amount', 'date'])
      if (exps.length === 0 && incs.length === 0) return true
      const years = new Set([
        String(new Date().getFullYear()),
        ...exps.map(e => String(e.year)),
        ...incs.map(i => String(i.year))
      ])
      years.delete('year'); years.delete('NaN'); years.delete('undefined')
      const { exportToExcel } = await import('../utils/exportExcel')
      const buffer = await exportToExcel(freshCats.length > 0 ? freshCats : DEFAULT_CATEGORIES, exps, incs, Array.from(years))
      await uploadExcelToDrive(buffer, userName, t)
      return true
    } catch (e) {
      console.error('[BudgetIQ] Auto-sync failed:', e)
      return false
    }
  }, [userName])

  // Firestore mode: keep the Google Sheet as an exact copy, so switching back
  // (settings/db → 'sheets') loses nothing. Before overwriting it, rescue rows
  // an older copy of the app may have written to the Sheet since the last
  // mirror — new ids with a newer timestamp — instead of erasing them.
  // Returns the expense rows including anything rescued.
  async function mirrorToSheet(sid, t, expRows, incRows) {
    const { lastMirrorAt = 0 } = await getDbSettings(sid)
    sheets.forgetCachedTab(TABS.EXPENSES)
    const inSheet = await sheets.readAllExpenseRows(t)
    const known = new Set(expRows.map(r => String(r[0])))
    const rescued = inSheet.filter(r => r[0] && !known.has(String(r[0])) && +String(r[8] || '').slice(1) > lastMirrorAt)
    if (rescued.length) {
      await appendRows(TABS.EXPENSES, rescued, t)
      console.warn('[BudgetIQ] Rescued rows written to the Sheet after the switch:', rescued)
    }
    const all = [...expRows, ...rescued]
    await sheets.writeAllExpenseRows(all, t)
    await sheets.writeAllIncomeRows(incRows, t)
    await setDbMode(sid, 'firestore', { lastMirrorAt: Date.now() })
    return all
  }

  // After the initial load, regenerate the Drive sheet ONCE if it was last
  // written with an older export format than the running code. If it's already
  // current, do nothing (no wasteful re-upload). Guarded so it runs once/mount.
  const formatCheckedRef = useRef(false)
  const syncFormatIfStale = useCallback(async () => {
    if (formatCheckedRef.current) return
    const t = getToken()
    const sid = getSheetId()
    if (!t || !sid) return
    formatCheckedRef.current = true
    try {
      const meta = await getSheetSyncMetaFS(sid)
      if ((meta?.formatVersion || 0) >= SHEET_FORMAT_VERSION) return  // sheet already on latest format
      toast.loading('Updating your sheet to the latest format…', { id: 'fmt-sync' })
      const ok = await _syncToDriveNow()
      if (ok) {
        await setSheetFormatVersionFS(sid, SHEET_FORMAT_VERSION)
        toast.success('Sheet updated to the latest format ✓', { id: 'fmt-sync', duration: 3000 })
      } else {
        toast.dismiss('fmt-sync')
        formatCheckedRef.current = false   // allow a retry on the next load
      }
    } catch (e) {
      console.warn('[BudgetIQ] format sync skipped:', e)
      toast.dismiss('fmt-sync')
      formatCheckedRef.current = false
    }
  }, [_syncToDriveNow])

  // Run the format check once the first data load has finished — fetch first,
  // then sync only if the Drive sheet's format is behind the current code.
  useEffect(() => {
    if (didInitialLoad) syncFormatIfStale()
  }, [didInitialLoad, syncFormatIfStale])

  // Debounced Drive backup. The Google Sheet is the source of truth and is
  // written synchronously in each handler; the Excel-on-Drive copy is just a
  // backup, so coalescing rapid edits (e.g. several comments) into a single
  // upload a couple seconds after the last change saves a lot of round-trips.
  const _syncTimerRef = useRef(null)
  const autoSyncToDrive = useCallback(() => {
    if (_syncTimerRef.current) clearTimeout(_syncTimerRef.current)
    _syncTimerRef.current = setTimeout(() => {
      _syncTimerRef.current = null
      _syncToDriveNow()
    }, 2500)
  }, [_syncToDriveNow])

  useEffect(() => () => { if (_syncTimerRef.current) clearTimeout(_syncTimerRef.current) }, [])

  return {
    categories, expenses, income, loading, didInitialLoad, needsSetup, availableYears,
    loadAll, autoSyncToDrive,
    setCategories, setNeedsSetup, missingConfig,
    offlineSince, pendingCount, queueOffline, dbMode
  }
}
