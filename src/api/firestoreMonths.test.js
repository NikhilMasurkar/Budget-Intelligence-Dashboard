import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fake from '../test/fakeFirestore'

vi.mock('firebase/firestore', () => import('../test/fakeFirestore'))
vi.mock('../firebase', () => ({ db: {} }))
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }))

vi.mock('./session', () => ({ getSheetId: () => 'S', uid: () => 'u' + Math.random().toString(36).slice(2, 8) }))

import { readItems, writeItems, upsertItems } from './firestoreMonths'
import * as store from './store'

const E = (id, m, name, amount, o = {}) => ({ id, year: '2026', month: String(m), categoryId: 'food', itemName: name, amount, isFixed: false, note: '', updatedAt: 'U1', ...o })
const entry = (path, id) => fake.docs.get(`sheets/S/months/${path}`)?.expenses?.[id]

beforeEach(() => { fake.reset() })

describe('month documents', () => {
  it('round-trips rows, storing numbers and booleans', async () => {
    await upsertItems('S', 'expenses', [E('a', 11, 'Tea', '40'), E('b', 11, 'Rent', '5,000', { isFixed: true, note: 'n', updatedAt: 'U2' })])
    expect(entry('2026-11', 'b')).toMatchObject({ amount: 5000, isFixed: true })
    const rows = await readItems('S', 'expenses')
    expect(rows).toContainEqual(E('b', 11, 'Rent', 5000, { isFixed: true, note: 'n', updatedAt: 'U2' }))
  })

  it('writes only what changed, leaving another device\'s edit to a different expense alone', async () => {
    await upsertItems('S', 'expenses', [E('a', 11, 'Tea', 40), E('b', 11, 'Bus', 20)])
    const rows = await readItems('S', 'expenses')
    fake.docs.get('sheets/S/months/2026-11').expenses.b.amount = 25      // other device, after our read
    rows.find(r => r.id === 'a').amount = 45
    await writeItems('S', 'expenses', rows)
    expect(entry('2026-11', 'a').amount).toBe(45)
    expect(entry('2026-11', 'b').amount).toBe(25)
  })

  it('deletes only rows the read had — never one added elsewhere since', async () => {
    await upsertItems('S', 'expenses', [E('a', 11, 'Tea', 40), E('b', 11, 'Bus', 20)])
    const rows = await readItems('S', 'expenses')
    await upsertItems('S', 'expenses', [E('c', 11, 'Lunch', 90)])          // other device
    await writeItems('S', 'expenses', rows.filter(r => r.id !== 'a'))
    expect(entry('2026-11', 'a')).toBeUndefined()
    expect(entry('2026-11', 'b')).toBeDefined()
    expect(entry('2026-11', 'c')).toBeDefined()
  })

  it('moves an expense between months', async () => {
    await upsertItems('S', 'expenses', [E('a', 11, 'Tea', 40)])
    const rows = await readItems('S', 'expenses')
    rows[0].month = '12'
    await writeItems('S', 'expenses', rows)
    expect(entry('2026-11', 'a')).toBeUndefined()
    expect(entry('2026-12', 'a')).toMatchObject({ itemName: 'Tea' })
  })

  it('can delete the very last remaining expense', async () => {
    await upsertItems('S', 'expenses', [E('a', 11, 'Tea', 40)])
    const rows = await readItems('S', 'expenses')
    await writeItems('S', 'expenses', rows.filter(() => false))
    expect(await readItems('S', 'expenses')).toEqual([])
  })
})

describe('store', () => {
  it('adds, edits and deletes a single expense', async () => {
    await store.saveExpense({ year: 2026, month: 11, categoryId: 'food', itemName: 'Tea', amount: 40 })
    let [e] = await store.fetchExpenses(2026)
    expect(e).toMatchObject({ itemName: 'Tea', amount: 40, isFixed: false })
    await store.saveExpense({ ...e, amount: 55, isFixed: true })
    ;[e] = await store.fetchExpenses()
    expect(e).toMatchObject({ amount: 55, isFixed: true })
    await store.deleteExpense(e.id)
    expect(await store.fetchExpenses()).toEqual([])
  })

  it('copies selected expenses into next month (December → January), skipping ones already there', async () => {
    await upsertItems('S', 'expenses', [E('a', 12, 'Tea', 40), E('b', 12, 'Rent', 9000), E('c', 1, 'Rent', 9000, { year: '2027' })])
    const r = await store.copyExpensesToNextMonth(2026, 12, ['a', 'b'])
    expect(r).toEqual({ copied: 1, toYear: 2027, toMonth: 1 })
    expect((await store.fetchExpenses(2027)).map(e => e.itemName).sort()).toEqual(['Rent', 'Tea'])
  })

  it('auto-copies only last month\'s pinned expenses, once', async () => {
    await upsertItems('S', 'expenses', [E('a', 10, 'Rent', 9000, { isFixed: true }), E('b', 10, 'Tea', 40)])
    expect(await store.autoFixedCopyToMonth(2026, 11)).toBe(1)
    expect(await store.autoFixedCopyToMonth(2026, 11)).toBe(0)
    expect((await store.fetchExpenses()).filter(e => e.month === '11').map(e => e.itemName)).toEqual(['Rent'])
  })

  it('saves and deletes income', async () => {
    await store.saveIncome({ year: 2026, month: 11, source: 'Salary', amount: 90000, date: '2026-11-01' })
    const [i] = await store.fetchIncome(2026)
    expect(i).toMatchObject({ source: 'Salary', amount: 90000 })
    await store.deleteIncome(i.id)
    expect(await store.fetchIncome()).toEqual([])
  })
})

describe('restoreBackup', () => {
  it('replaces everything: backup entries written, the rest deleted, categories swapped', async () => {
    await upsertItems('S', 'expenses', [E('old', 10, 'Old', 1), E('keep', 11, 'Tea', 40)])
    fake.docs.set('sheets/S/categories/gone', { id: 'gone', name: 'Gone' })
    await store.restoreBackup({
      categories: [{ id: 'food', name: 'Food' }],
      expenses: [E('keep', 11, 'Tea', 45), E('new', 9, 'Bus', 20)],
      income: [{ id: 'i1', year: '2026', month: '11', source: 'Salary', amount: 1000, date: '' }],
    })
    const rows = await readItems('S', 'expenses')
    expect(rows.map(r => r.id).sort()).toEqual(['keep', 'new'])
    expect(rows.find(r => r.id === 'keep').amount).toBe(45)
    expect((await readItems('S', 'income')).map(r => r.source)).toEqual(['Salary'])
    expect(fake.docs.has('sheets/S/categories/gone')).toBe(false)
    expect(fake.docs.get('sheets/S/categories/food')).toMatchObject({ name: 'Food', order: 0 })
  })
})
