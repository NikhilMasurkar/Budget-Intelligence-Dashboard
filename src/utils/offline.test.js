// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ── Sheets / Firestore stand-ins ─────────────────────────────────────────────
const sheet = { rows: [] }
vi.mock('../api/sheets', () => ({
  getToken: vi.fn(() => 'tok'),
  getSheetId: vi.fn(() => 'sid1'),
  uid: vi.fn(() => 'new-id'),
  saveExpense: vi.fn(async () => {}),
  appendRows: vi.fn(async (_tab, rows) => { sheet.rows.push(...rows) }),
  readAllExpenseRows: vi.fn(async () => sheet.rows.map(r => [...r])),
  writeAllExpenseRows: vi.fn(async () => {}),
  readAllIncomeRows: vi.fn(async () => []),
  writeAllIncomeRows: vi.fn(async () => {}),
  forgetCachedTab: vi.fn(),
  copyExpensesToNextMonth: vi.fn(),
  fetchCategories: vi.fn(async () => []),
  fetchExpenses: vi.fn(async () => sheet.rows.map(r => ({ id: r[0], year: r[1], month: r[2], categoryId: r[3], itemName: r[4], amount: r[5] }))),
  fetchIncome: vi.fn(async () => []),
  downloadExcelFromDrive: vi.fn(async () => null),
  uploadExcelToDrive: vi.fn(async () => {}),
  autoFixedCopyToMonth: vi.fn(async () => 0),
  signOut: vi.fn(),
  DEFAULT_CATEGORIES: [],
  TABS: { EXPENSES: 'Expenses', INCOME: 'Income', CATEGORIES: 'Categories' },
}))
vi.mock('../api/firestoreCategories', () => ({
  fetchCategoriesFS: vi.fn(async () => [{ id: 'c_food', name: 'Food', type: 'expense' }]),
  saveAllCategoriesFS: vi.fn(async () => {}),
}))
vi.mock('../api/firestoreExpenseMeta', () => ({
  fetchExpenseMetaFS: vi.fn(async () => ({})),
  expensePinKey: vi.fn(() => 'k'),
  setExpenseMetaFS: vi.fn(async () => {}),
}))
vi.mock('../api/firestoreSettings', () => ({
  getSheetSyncMetaFS: vi.fn(async () => ({ formatVersion: 999 })),
  setSheetFormatVersionFS: vi.fn(async () => {}),
}))
vi.mock('react-hot-toast', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() }) }))

import * as sheets from '../api/sheets'
import * as categoriesFS from '../api/firestoreCategories'
import {
  isNetworkError, getQueue, queueRow, saveSnapshot, loadSnapshot, clearOfflineData,
} from './offline'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgetData } from '../hooks/useBudgetData'

// Node's own experimental localStorage shadows jsdom's and is unusable here.
const store = new Map()
vi.stubGlobal('localStorage', {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
})

const setOnline = (v) => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v })
const row = (id, name = 'Tea') => [id, '2026', '11', 'c_food', name, 40, 'FALSE', '', 'U1']

beforeEach(() => {
  localStorage.clear()
  sheet.rows = []
  setOnline(true)
  vi.clearAllMocks()
  for (const k of ['VITE_GOOGLE_SHEETS_API_KEY', 'VITE_GOOGLE_OAUTH_CLIENT_ID', 'VITE_FIREBASE_PROJECT_ID']) vi.stubEnv(k, 'x')
})
afterEach(() => { vi.unstubAllEnvs() })

describe('offline storage helpers', () => {
  it('tells a dropped connection apart from Google refusing', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)      // Chrome
    expect(isNetworkError(new TypeError('Load failed'))).toBe(true)          // Safari
    expect(isNetworkError({ code: 'unavailable', message: 'x' })).toBe(true) // Firestore
    expect(isNetworkError(new Error('The caller does not have permission'))).toBe(false)
    expect(isNetworkError(new TypeError("Cannot read properties of undefined"))).toBe(false) // a bug, not the network
    setOnline(false)
    expect(isNetworkError(new Error('anything'))).toBe(true)
  })

  it('keeps a queue and a snapshot per sheet, and clears both on sign-out', () => {
    queueRow('sid1', row('a'))
    saveSnapshot('sid1', { expenses: [1] })
    expect(getQueue('sid1')).toHaveLength(1)
    expect(getQueue('other')).toEqual([])
    expect(loadSnapshot('sid1').savedAt).toBeGreaterThan(0)
    clearOfflineData('sid1')
    expect(getQueue('sid1')).toEqual([])
    expect(loadSnapshot('sid1')).toBeNull()
  })

})

describe('saving an expense with no connection', () => {
  const setup = () => {
    const queueOffline = vi.fn()
    const closeModal = vi.fn()
    const { result } = renderHook(() => useExpenses({
      loadAll: vi.fn(), autoSyncToDrive: vi.fn(), year: 2026, month: 11,
      setDeleteConfirm: vi.fn(), closeModal, clearSelection: vi.fn(), queueOffline,
    }))
    return { result, queueOffline, closeModal }
  }
  const newExp = () => ({ id: '', year: 2026, month: 11, categoryId: 'c_food', itemName: 'tea', amount: 40, isFixed: false, note: '' })

  it('queues a new expense on the phone instead of failing', async () => {
    setOnline(false)
    const { result, queueOffline, closeModal } = setup()
    await act(() => result.current.handleSaveExpense(newExp(), 'single'))
    expect(sheets.saveExpense).not.toHaveBeenCalled()
    expect(queueOffline).toHaveBeenCalledWith(['new-id', '2026', '11', 'c_food', 'Tea', 40, 'FALSE', '', expect.stringMatching(/^U\d+/)])
    expect(closeModal).toHaveBeenCalled()
  })

  it('queues it under the SAME id when the request drops mid-way, so a sync cannot duplicate it', async () => {
    sheets.saveExpense.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result, queueOffline } = setup()
    await act(() => result.current.handleSaveExpense(newExp(), 'single'))
    const sentId = sheets.saveExpense.mock.calls[0][0].id
    expect(queueOffline.mock.calls[0][0][0]).toBe(sentId)
  })

  it('refuses edits and multi-month saves offline — those rewrite the whole sheet', async () => {
    setOnline(false)
    const { result, queueOffline } = setup()
    await expect(act(() => result.current.handleSaveExpense({ ...newExp(), id: 'e1' }, 'single'))).rejects.toThrow(/Needs a connection/)
    await expect(act(() => result.current.handleSaveExpense(newExp(), 'all_year'))).rejects.toThrow(/Needs a connection/)
    expect(queueOffline).not.toHaveBeenCalled()
  })
})

describe('loading and syncing', () => {
  it('online with a lapsed sign-in shows the sign-in screen, not the saved copy', async () => {
    saveSnapshot('sid1', { categories: [], expenses: [{ id: 'a' }], income: [] })
    sheets.getToken.mockReturnValue(null)
    const { result } = renderHook(() => useBudgetData({ authd: false, userName: 'N', onUnauthorized: vi.fn() }))
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.offlineSince).toBeNull()
    expect(result.current.expenses).toEqual([])
    sheets.getToken.mockReturnValue('tok')
  })

  const render = () => renderHook(() => useBudgetData({ authd: true, userName: 'N', onUnauthorized: vi.fn() }))

  it('sends queued rows on the next load, skipping any the sheet already has', async () => {
    sheet.rows = [row('a')]                    // 'a' reached the sheet before the connection dropped
    queueRow('sid1', row('a'))
    queueRow('sid1', row('b', 'Bus'))
    const { result } = render()
    await waitFor(() => expect(result.current.didInitialLoad).toBe(true))
    expect(sheets.appendRows).toHaveBeenCalledTimes(1)
    expect(sheets.appendRows.mock.calls[0][1].map(r => r[0])).toEqual(['b'])
    expect(getQueue('sid1')).toEqual([])
    expect(result.current.pendingCount).toBe(0)
  })

  it('saves a copy after each load and shows it when offline, with pending rows on top', async () => {
    sheet.rows = [row('a')]
    const first = render()
    await waitFor(() => expect(first.result.current.didInitialLoad).toBe(true))
    expect(loadSnapshot('sid1').expenses.map(e => e.id)).toEqual(['a'])
    first.unmount()

    setOnline(false)
    queueRow('sid1', row('q', 'Snack'))
    const { result } = render()
    await waitFor(() => expect(result.current.offlineSince).not.toBeNull())
    expect(result.current.expenses.map(e => [e.id, !!e.pending])).toEqual([['a', false], ['q', true]])
    expect(result.current.pendingCount).toBe(1)
    expect(categoriesFS.fetchCategoriesFS).toHaveBeenCalledTimes(1)   // offline load never hit the network
  })

  it('falls back to the copy when the browser says online but requests fail', async () => {
    saveSnapshot('sid1', { categories: [], expenses: [{ id: 'a' }], income: [] })
    categoriesFS.fetchCategoriesFS.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = render()
    await waitFor(() => expect(result.current.offlineSince).not.toBeNull())
    expect(result.current.expenses.map(e => e.id)).toEqual(['a'])
  })
})
