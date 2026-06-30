import { describe, it, expect } from 'vitest'
import { reconcileExpenses, reconcileIncome } from './reconcile'

const ID = () => 'NEWID' // deterministic id for assertions

// DB expense row: [id, year, month, categoryId, itemName, amount, isFixed, note, updatedAt]
const dbExp = (o) => [
  o.id, o.year ?? '2030', o.month ?? '1', o.categoryId ?? 'c1',
  o.itemName ?? 'Rent', o.amount ?? '100', o.isFixed ?? 'FALSE', o.note ?? '', o.updatedAt ?? 'U1',
]
const xlsExp = (o) => ({
  year: '2030', month: '1', categoryId: 'c1', itemName: 'Rent', amount: '100',
  isFixed: 'FALSE', note: '', ...o,
})

describe('reconcileExpenses — current (name-composite) behaviour', () => {
  it('matches by year-month-category-item and keeps the DB id + pin/note', () => {
    const db = [dbExp({ id: 'db1', amount: '100', isFixed: 'TRUE', note: 'paid', updatedAt: 'U9' })]
    const xls = [xlsExp({ amount: '120', isFixed: 'FALSE', note: '' })] // Excel changed amount
    const { rows, changed } = reconcileExpenses(xls, db, ID)

    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r[0]).toBe('db1')      // DB id preserved
    expect(r[5]).toBe('120')      // amount from Excel wins
    expect(r[6]).toBe('TRUE')     // isFixed: DB pin wins
    expect(r[7]).toBe('paid')     // note: DB wins
    expect(r[8]).toBe('U9')       // updatedAt preserved
    expect(changed).toBe(true)    // amount differed
  })

  it('no change → changed=false (skips the write)', () => {
    const db = [dbExp({ id: 'db1', amount: '100', isFixed: 'FALSE' })]
    const xls = [xlsExp({ amount: '100', isFixed: 'FALSE' })]
    expect(reconcileExpenses(xls, db, ID).changed).toBe(false)
  })

  it('preserves Sheet-only rows not present in the Excel', () => {
    const db = [dbExp({ id: 'db1' }), dbExp({ id: 'db2', month: '5', itemName: 'Gym' })]
    const xls = [xlsExp({})] // only matches db1
    const { rows } = reconcileExpenses(xls, db, ID)
    expect(rows.map(r => r[0]).sort()).toEqual(['db1', 'db2'])
  })

  it('Excel-only row gets a fresh id', () => {
    const { rows } = reconcileExpenses([xlsExp({ itemName: 'New thing' })], [], ID)
    expect(rows).toHaveLength(1)
    expect(rows[0][0]).toBe('NEWID')
  })

  // CHARACTERIZATION of the known bug milestone 3 will fix: a rename breaks the
  // name-based match, so the row is DUPLICATED (new id) and the old one lingers.
  it('BUG: renaming an item duplicates it (name key no longer matches)', () => {
    const db = [dbExp({ id: 'db1', itemName: 'Electrcity' })] // typo in DB
    const xls = [xlsExp({ itemName: 'Electricity' })]          // fixed in Excel
    const { rows } = reconcileExpenses(xls, db, ID)
    expect(rows).toHaveLength(2) // <-- duplicate; should be 1 after the fix
    expect(rows.map(r => r[4]).sort()).toEqual(['Electrcity', 'Electricity'])
  })
})

describe('reconcileIncome — current behaviour', () => {
  const dbInc = (o) => [o.id, o.year ?? '2030', o.month ?? '1', o.source ?? 'Salary', o.amount ?? '1000']
  const xlsInc = (o) => ({ year: '2030', month: '1', source: 'Salary', amount: '1000', ...o })

  it('matches by year-month-source and keeps the DB id', () => {
    const { rows, changed } = reconcileIncome([xlsInc({ amount: '2000' })], [dbInc({ id: 'i1' })], ID)
    expect(rows).toHaveLength(1)
    expect(rows[0][0]).toBe('i1')
    expect(rows[0][4]).toBe('2000')
    expect(changed).toBe(true)
  })

  it('preserves Sheet-only income and assigns ids to Excel-only income', () => {
    const { rows } = reconcileIncome(
      [xlsInc({ source: 'Dividend' })],
      [dbInc({ id: 'i1' })],
      ID,
    )
    expect(rows.map(r => r[0]).sort()).toEqual(['NEWID', 'i1'])
  })
})
