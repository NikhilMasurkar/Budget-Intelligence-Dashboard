import { describe, it, expect } from 'vitest'
import { parseBackup } from './backupFile'

const ok = { app: 'BudgetIQ', exportedAt: '2026-11-22T03:30:00Z', categories: [{ id: 'food', name: 'Food' }],
  expenses: [{ id: 'e1', year: 2026, month: 11, itemName: 'Tea', amount: 40 }],
  income: [{ id: 'i1', year: '2026', month: '11', source: 'Salary', amount: 1000 }] }

describe('parseBackup', () => {
  it('reads both backup shapes, with year/month as strings', () => {
    const b = parseBackup(JSON.stringify(ok))
    expect(b.expenses[0]).toMatchObject({ id: 'e1', year: '2026', month: '11', itemName: 'Tea' })
    expect(b.income[0].month).toBe('11')
    expect(b.categories).toHaveLength(1)
    expect(b.exportedAt).toBe(ok.exportedAt)
  })
  it('refuses files that would damage or erase the data', () => {
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/)
    expect(() => parseBackup('{"rows":[]}')).toThrow(/no expenses/)
    expect(() => parseBackup(JSON.stringify({ ...ok, expenses: [{ id: 'x', year: 2026 }] }))).toThrow(/without an id, year or month/)
    expect(() => parseBackup(JSON.stringify({ ...ok, expenses: [], income: [] }))).toThrow(/empty/)
    expect(() => parseBackup(JSON.stringify({ ...ok, categories: [{ name: 'x' }] }))).toThrow(/category without an id/)
  })
})
