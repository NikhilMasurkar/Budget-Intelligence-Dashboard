import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fake from '../test/fakeFirestore'

vi.mock('firebase/firestore', () => import('../test/fakeFirestore'))
vi.mock('../firebase', () => ({ db: {} }))
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }))

const sheet = { exp: [], inc: [], reads: 0, onRead: null }
vi.mock('./sheets', () => ({
  getSheetId: () => 'S',
  getToken: () => 'tok',
  uid: () => 'u' + Math.random().toString(36).slice(2, 8),
  forgetCachedTab: () => {},
  TABS: { EXPENSES: 'Expenses', INCOME: 'Income' },
  readAllExpenseRows: async () => { sheet.reads++; sheet.onRead?.(); return sheet.exp.map(r => [...r]) },
  readAllIncomeRows: async () => sheet.inc.map(r => [...r]),
}))
vi.mock('./firestoreExpenseMeta', () => ({
  fetchExpenseMetaFS: async () => ({ '2026_11_food_rent': { isFixed: true, note: '[{"text":"from meta","ts":1}]' } }),
  expensePinKey: ({ year, month, categoryId, itemName }) => `${year}_${month}_${categoryId}_${String(itemName).toLowerCase()}`,
}))

import { readRows, writeRows, upsertRows, replaceAllMonths } from './firestoreMonths'
import { migrateToFirestore, prepareRows } from './migrate'
import { usingFirestore, resolveDbMode } from './store'
import { compareData } from '../utils/verifyData'

const E = (id, m, name, amount, extra = []) => [id, '2026', String(m), 'food', name, amount, 'FALSE', '', 'U1', ...extra]
const entry = (path, id) => fake.docs.get(`sheets/S/months/${path}`)?.expenses?.[id]

beforeEach(() => { fake.reset(); sheet.exp = []; sheet.inc = []; sheet.reads = 0; sheet.onRead = null })

describe('month documents', () => {
  it('round-trips rows, storing numbers and booleans', async () => {
    await upsertRows('S', 'expenses', [E('a', 11, 'Tea', '40'), [...E('b', 11, 'Rent', '5,000').slice(0, 6), 'TRUE', 'n', 'U2']])
    expect(entry('2026-11', 'b')).toMatchObject({ amount: 5000, isFixed: true })
    const rows = await readRows('S', 'expenses')
    expect(rows).toContainEqual(['b', '2026', '11', 'food', 'Rent', 5000, 'TRUE', 'n', 'U2'])
  })

  it('writes only what changed, leaving another device\'s edit to a different expense alone', async () => {
    await upsertRows('S', 'expenses', [E('a', 11, 'Tea', 40), E('b', 11, 'Bus', 20)])
    const rows = await readRows('S', 'expenses')
    fake.docs.get('sheets/S/months/2026-11').expenses.b.amount = 25      // other device, after our read
    rows.find(r => r[0] === 'a')[5] = 45
    await writeRows('S', 'expenses', rows)
    expect(entry('2026-11', 'a').amount).toBe(45)
    expect(entry('2026-11', 'b').amount).toBe(25)
  })

  it('deletes only rows the read had — never one added elsewhere since', async () => {
    await upsertRows('S', 'expenses', [E('a', 11, 'Tea', 40), E('b', 11, 'Bus', 20)])
    const rows = await readRows('S', 'expenses')
    await upsertRows('S', 'expenses', [E('c', 11, 'Lunch', 90)])          // other device
    await writeRows('S', 'expenses', rows.filter(r => r[0] !== 'a'))
    expect(entry('2026-11', 'a')).toBeUndefined()
    expect(entry('2026-11', 'b')).toBeDefined()
    expect(entry('2026-11', 'c')).toBeDefined()
  })

  it('moves an expense between months', async () => {
    await upsertRows('S', 'expenses', [E('a', 11, 'Tea', 40)])
    const rows = await readRows('S', 'expenses')
    rows[0][2] = '12'
    await writeRows('S', 'expenses', rows)
    expect(entry('2026-11', 'a')).toBeUndefined()
    expect(entry('2026-12', 'a')).toMatchObject({ itemName: 'Tea' })
  })

  it('can delete the very last remaining expense', async () => {
    await upsertRows('S', 'expenses', [E('a', 11, 'Tea', 40)])
    const rows = await readRows('S', 'expenses')
    await writeRows('S', 'expenses', rows.filter(() => false))
    expect(await readRows('S', 'expenses')).toEqual([])
  })

  it('replaceAllMonths clears leftovers from an earlier attempt', async () => {
    await upsertRows('S', 'expenses', [E('old', 3, 'Stale', 1)])
    await replaceAllMonths('S', [E('a', 11, 'Tea', 40)], [])
    expect(fake.docs.has('sheets/S/months/2026-03')).toBe(false)
    expect((await readRows('S', 'expenses')).map(r => r[0])).toEqual(['a'])
  })
})

describe('compareData', () => {
  const base = { expenses: [E('a', 11, 'Tea', '40')], income: [['i', '2026', '11', 'Salary', '90000', '']] }
  it('passes for the same data in different shapes', () => {
    expect(compareData(base, { expenses: [E('a', 11, 'Tea', 40)], income: [['i', '2026', '11', 'Salary', 90000, '']] }).ok).toBe(true)
  })
  it('catches a missing row, a changed amount, and a lost pin or comment', () => {
    expect(compareData(base, { ...base, expenses: [] }).ok).toBe(false)
    expect(compareData(base, { ...base, expenses: [E('a', 11, 'Tea', 41)] }).problems[0]).toMatch(/total/)
    const pinned = { ...base, expenses: [[...E('a', 11, 'Tea', 40).slice(0, 6), 'TRUE', 'note', 'U1']] }
    expect(compareData(pinned, base).problems.join()).toMatch(/pin.*comments|comments/)
  })
})

describe('migration', () => {
  it('gives blank and repeated ids their own stable id, and applies app pins/comments', () => {
    const { expenses } = prepareRows([E('', 11, 'A', 1), E('x', 11, 'B', 2), E('x', 11, 'C', 3), E('r', 11, 'rent', 9), []], [],
      { '2026_11_food_rent': { isFixed: true, note: '[{"text":"from meta","ts":1}]' } })
    expect(expenses.map(r => r[0])).toEqual(['e-row2', 'x', 'x-dup', 'r'])
    expect(expenses[3][6]).toBe('TRUE')
    expect(expenses[3][7]).toMatch(/from meta/)
    expect(prepareRows([E('', 11, 'A', 1)], [])).toEqual(prepareRows([E('', 11, 'A', 1)], []))  // stable across reads
  })

  it('copies everything, verifies it, and only then switches', async () => {
    sheet.exp = [E('a', 11, 'Tea', '40'), E('r', 11, 'rent', '9000'), [...E('b', 12, 'Bus', '20').slice(0, 7), '[{"text":"hi","ts":2}]', 'U3']]
    sheet.inc = [['i', '2026', '11', 'Salary', '90000', '2026-11-01']]
    expect(await migrateToFirestore('S', 'tok')).toBe(true)
    expect(usingFirestore()).toBe(true)
    expect(fake.docs.get('sheets/S/settings/db')).toMatchObject({ source: 'firestore', migratedCounts: { expenses: 3, income: 1 } })
    const stored = { expenses: await readRows('S', 'expenses'), income: await readRows('S', 'income') }
    expect(compareData(prepareRows(sheet.exp, sheet.inc, { '2026_11_food_rent': { isFixed: true, note: '[{"text":"from meta","ts":1}]' } }), stored).ok).toBe(true)
  })

  it('does NOT switch if the sheet keeps changing underneath it', async () => {
    fake.docs.set('sheets/S/settings/db', { source: 'sheets' })
    await resolveDbMode('S')
    sheet.exp = [E('a', 11, 'Tea', '40')]
    sheet.onRead = () => sheet.exp.push(E('n' + sheet.reads, 11, 'More', 1))
    // a fresh module state: the previous test's success is per module, so import again
    vi.resetModules()
    const m = await import('./migrate')
    const s = await import('./store')
    await s.resolveDbMode('S')
    expect(await m.migrateToFirestore('S', 'tok')).toBe(false)
    expect(s.usingFirestore()).toBe(false)
    expect(fake.docs.get('sheets/S/settings/db').source).toBe('sheets')
  })
})
