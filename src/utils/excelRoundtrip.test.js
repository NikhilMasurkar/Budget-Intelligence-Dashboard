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
