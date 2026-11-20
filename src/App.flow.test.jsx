// @vitest-environment jsdom
// The whole app, end to end, on an in-memory Firestore: a restored sign-in,
// the PIN lock, adding an expense, and the PDF download. Only the edges are
// faked: Firebase itself, the browser's push/biometrics, chart canvas, PDF file.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

// Node's built-in localStorage (without a file) hides jsdom's; use a plain one.
vi.hoisted(() => {
  const store = () => {
    const m = new Map()
    return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)),
      removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
      get length() { return m.size } }
  }
  Object.defineProperty(globalThis, 'localStorage', { value: store(), configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: store(), configurable: true })
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
})

vi.mock('firebase/firestore', async () => {
  const fake = await import('./test/fakeFirestore')
  return {
    ...fake,
    // Owner lookup: the fake has no where/limit, so match ownerUid by hand.
    where: (field, _op, value) => ({ field, value }),
    limit: () => null,
    query: (col, w) => (w?.field ? { ...col, where: w } : col),
    getDocs: async (q) => {
      const snap = await fake.getDocs(q)
      return q.where ? { ...snap, docs: snap.docs.filter(d => d.data()[q.where.field] === q.where.value) } : snap
    },
    deleteDoc: async (ref) => { fake.docs.delete(ref.path) },
  }
})

const { user, exportToPdf } = vi.hoisted(() => ({
  user: { uid: 'uid_1', email: 'me@example.com', displayName: 'Test User', photoURL: '' },
  exportToPdf: vi.fn(async () => {}),
}))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, cb) => { setTimeout(() => cb(user), 0); return () => {} },
  GoogleAuthProvider: { credential: () => ({}) },
  signInWithCredential: async () => ({ user }),
}))
vi.mock('./firebase', () => ({
  db: {},
  auth: { currentUser: { ...user, getIdToken: async () => 'tok' }, authStateReady: async () => {} },
  firebaseSignOut: async () => {},
  wipeLocalCache: async () => {},
  getFirebaseUid: () => 'uid_1',
}))
vi.mock('./api/biometric', () => ({
  isBiometricsAvailable: async () => false,
  hasBiometricCredential: () => false,
  registerBiometric: async () => false,
  verifyBiometric: async () => false,
  clearBiometric: () => {},
}))
vi.mock('./api/pushSubscription', () => ({
  getPushStatus: async () => 'unsubscribed',
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
}))
vi.mock('react-chartjs-2', () => ({ Bar: () => null, Doughnut: () => null, Line: () => null }))
vi.mock('./utils/exportPdf', () => ({ exportToPdf }))

import * as fake from './test/fakeFirestore'
import { makePinHash } from './api/firestoreSettings'
import { YEAR_NOW, MONTH_NOW_1 } from './utils/constants'
import App from './App'

const SID = 'sheet_1'
const monthDoc = () => fake.docs.get(`sheets/${SID}/months/${YEAR_NOW}-${String(MONTH_NOW_1).padStart(2, '0')}`)
const pressPin = (pin) => [...pin].forEach(d => fireEvent.click(screen.getByRole('button', { name: d })))

describe('App flow', () => {
  beforeEach(async () => {
    fake.reset(); localStorage.clear(); sessionStorage.clear(); exportToPdf.mockClear()
    fake.docs.set(`sheets/${SID}`, { ownerUid: 'uid_1' })
    fake.docs.set(`sheets/${SID}/settings/security`, { pinHash: await makePinHash('1234') })
  })

  it('signs in, rejects a wrong PIN, unlocks, adds an expense, downloads the PDF', async () => {
    render(<App />)

    // Restored sign-in finds the owned sheet and asks for the PIN.
    await screen.findByText(/Enter your PIN|Enter PIN/i, {}, { timeout: 5000 })
    pressPin('9999')
    await waitFor(() => expect(sessionStorage.getItem('budgetiq_pin_verified')).toBeNull())
    await waitFor(() => expect(screen.getByRole('button', { name: '1' }).disabled).toBe(false), { timeout: 5000 })
    pressPin('1234')
    const fab = await screen.findByRole('button', { name: 'Add expense' }, { timeout: 8000 })
    expect(localStorage.getItem('budgetiq_sheetId')).toBe(SID)

    // Add an expense through the real modal; it lands in this month's document.
    fireEvent.click(fab)
    const select = (await screen.findByRole('option', { name: '-- Select Category --' })).closest('select')
    const firstCat = within(select).getAllByRole('option')[1].value
    fireEvent.change(select, { target: { value: firstCat } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Electricity Bill'), { target: { value: 'Groceries run' } })
    fireEvent.change(document.querySelector('input[inputmode="none"]'), { target: { value: '450' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }))
    await waitFor(() => {
      const saved = Object.values(monthDoc()?.expenses || {})
      expect(saved).toEqual([expect.objectContaining({ itemName: 'Groceries run', amount: 450, categoryId: firstCat })])
    }, { timeout: 8000 })

    // Download PDF hands the saved expense to the PDF writer.
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))   // top bar
    await screen.findByText('Full backup of all years (.json)', {}, { timeout: 5000 })
    const go = screen.getByRole('button', { name: 'Download PDF' })   // the modal's; MUI hides the page behind it
    await waitFor(() => expect(go.disabled).toBe(false), { timeout: 5000 })
    fireEvent.click(go)
    await waitFor(() => expect(exportToPdf).toHaveBeenCalled(), { timeout: 5000 })
    const [, expenses] = exportToPdf.mock.calls[0]
    expect(expenses.some(e => e.itemName === 'Groceries run' && e.amount === 450)).toBe(true)
  }, 30000)
})
