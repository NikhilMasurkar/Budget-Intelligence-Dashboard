import { describe, it, expect } from 'vitest'
import { exportToExcel } from './exportExcel'
import { importFromExcel } from './parseExcel'

// Categories must match by name on re-import (parseExcel resolves headers → ids).
const CATS = [
  { id: 'cat_rental', name: 'RENTAL HOME', type: 'expense', color: '#000' },
  { id: 'cat_invest', name: 'INVESTMENTS & SAVINGS', type: 'savings', color: '#000' },
]

const YEAR = '2030'
const EXPENSES = [
  { id: 'e1', year: YEAR, month: '1', categoryId: 'cat_rental', itemName: 'Rent', amount: '15000', isFixed: 'TRUE', note: '' },
  { id: 'e2', year: YEAR, month: '2', categoryId: 'cat_rental', itemName: 'Rent', amount: '15000', isFixed: 'FALSE', note: '' },
  { id: 'e3', year: YEAR, month: '1', categoryId: 'cat_invest', itemName: 'Sip', amount: '10000', isFixed: 'FALSE', note: '' },
  // A withdrawal: negative amount in a savings category must survive the round-trip.
  { id: 'e4', year: YEAR, month: '3', categoryId: 'cat_invest', itemName: 'Sip', amount: '-5000', isFixed: 'FALSE', note: '' },
]
const INCOME = [
  { id: 'i1', year: YEAR, month: '1', source: 'Salary', amount: '100000' },
  { id: 'i2', year: YEAR, month: '2', source: 'Salary', amount: '100000' },
]

const expKey = (e) => `${e.year}-${e.month}-${e.categoryId}-${String(e.itemName).toLowerCase()}`
const incKey = (i) => `${i.year}-${i.month}-${String(i.source).toLowerCase()}`

describe('Excel export → import round-trip', () => {
  it('preserves expense amounts per (year, month, category, item) — including withdrawals', async () => {
    const buffer = await exportToExcel(CATS, EXPENSES, INCOME, [YEAR])
    const parsed = await importFromExcel(buffer, CATS)

    const got = new Map(parsed.expenses.map(e => [expKey(e), Number(e.amount)]))
    for (const e of EXPENSES) {
      expect(got.get(expKey(e)), `expense ${e.itemName} ${e.month}`).toBe(Number(e.amount))
    }
    // The negative withdrawal specifically
    expect(got.get(`${YEAR}-3-cat_invest-sip`)).toBe(-5000)
  })

  it('preserves income amounts per (year, month, source)', async () => {
    const buffer = await exportToExcel(CATS, EXPENSES, INCOME, [YEAR])
    const parsed = await importFromExcel(buffer, CATS)

    const got = new Map(parsed.income.map(i => [incKey(i), Number(i.amount)]))
    for (const i of INCOME) {
      expect(got.get(incKey(i)), `income ${i.source} ${i.month}`).toBe(Number(i.amount))
    }
  })

  it('does not leak summary/total rows back in as expenses', async () => {
    const buffer = await exportToExcel(CATS, EXPENSES, INCOME, [YEAR])
    const parsed = await importFromExcel(buffer, CATS)
    const names = parsed.expenses.map(e => String(e.itemName).toLowerCase())
    expect(names.some(n => n.startsWith('total'))).toBe(false)
    expect(names).not.toContain('net savings')
  })
})

// ── Regression tests for mechanisms the round-trip depends on ────────────────
// These cover the app's own metadata (stable ids, notes) and the parser's
// structural filters, none of which the tests above touched.

const ONE_CAT = [{ id: 'cat_rental', name: 'RENTAL HOME', type: 'expense', color: '#000' }]
const ex = (id, m, name, amt) => ({
  id, year: YEAR, month: String(m), categoryId: 'cat_rental',
  itemName: name, amount: String(amt), isFixed: 'FALSE', note: '',
})
const roundTrip = async (exps, cats = ONE_CAT, years = [YEAR]) =>
  importFromExcel(await exportToExcel(cats, exps, [], years), cats)
const itemNames = (p) => p.expenses.map(e => String(e.itemName))

describe('Excel round-trip — metadata', () => {
  it('carries the stable row id, which rename-safe reconciliation depends on', async () => {
    const p = await roundTrip([ex('ID_RENT_JAN', 1, 'Rent', 15000)])
    expect(p.expenses.find(e => String(e.month) === '1')?.id).toBe('ID_RENT_JAN')
  })

  it('carries the note/comment JSON', async () => {
    const note = '[{"text":"paid by card","ts":123}]'
    const p = await roundTrip([{ ...ex('e1', 1, 'Rent', 15000), note }])
    expect(p.expenses[0].note).toBe(note)
  })

  it('keeps decimal precision — rounding here silently rewrote the Sheet', async () => {
    // reconcile lets the Excel amount win, so rounding on import permanently
    // destroyed paise: ₹1234.56 came back as ₹1235 and was written to the Sheet.
    const p = await roundTrip([ex('e1', 1, 'Rent', '1234.56')])
    expect(Number(p.expenses[0].amount)).toBeCloseTo(1234.56, 2)
  })

  it('keeps punctuation in item names intact', async () => {
    const name = "Kid's school, term-1 (₹)"
    const p = await roundTrip([ex('e1', 1, name, 900)])
    expect(itemNames(p)).toContain(name)
  })
})

describe('Excel round-trip — item names that collide with structural labels', () => {
  // The parser drops rows whose name looks like a generated total/summary. Real
  // items can look like that too, so rows carrying an embedded id note (written
  // only by exportExcel for genuine data rows) are now exempt.
  it('an item named "Summary" does not swallow the rows after it', async () => {
    const p = await roundTrip([
      ex('a', 1, 'Rent', 100), ex('b', 1, 'Summary', 200), ex('c', 1, 'Groceries', 300),
    ])
    expect(itemNames(p)).toContain('Groceries')
    expect(itemNames(p)).toContain('Summary')
  })

  it('an item starting with "Total " survives (Total is a fuel brand)', async () => {
    const p = await roundTrip([ex('a', 1, 'Rent', 100), ex('b', 1, 'Total station fuel', 250)])
    expect(itemNames(p)).toContain('Total station fuel')
  })

  it('an item named "Revenue" survives', async () => {
    const p = await roundTrip([ex('a', 1, 'Rent', 100), ex('b', 1, 'Revenue', 500)])
    expect(itemNames(p)).toContain('Revenue')
  })
})
