import { describe, it, expect } from 'vitest'
import {
  monthKey, computeYearlySummary, computeHoldingsMatrix,
  computePosition, computeHoldingsWithBalance,
} from './periodStats'

const INVEST = new Set(['c_inv'])
const exp  = (year, month, amount, categoryId = 'c_food') => ({ year, month, amount, categoryId })
const iexp = (year, month, amount, itemName) => ({ year, month, amount, itemName, categoryId: 'c_inv' })
const inc  = (year, month, amount) => ({ year, month, amount })

describe('monthKey', () => {
  it('orders months across a year boundary', () => {
    expect(monthKey(2025, 12)).toBeLessThan(monthKey(2026, 1))
    expect(monthKey(2026, 1)).toBeLessThan(monthKey(2026, 2))
  })
})

describe('computeYearlySummary', () => {
  it('splits investing out of spending, per year', () => {
    const r = computeYearlySummary({
      allIncome:   [inc(2025, 1, 100000), inc(2026, 1, 200000)],
      allExpenses: [
        exp(2025, 1, 40000), iexp(2025, 2, 10000, 'SIP'),
        exp(2026, 1, 50000), iexp(2026, 2, 30000, 'SIP'),
      ],
      investCatIds: INVEST,
    })
    expect(r).toEqual([
      { year: '2025', earned: 100000, spent: 40000, invested: 10000, kept: 60000 },
      { year: '2026', earned: 200000, spent: 50000, invested: 30000, kept: 150000 },
    ])
    // Investing must never reduce "kept" — that was the original bug.
    expect(r[1].kept).toBe(r[1].earned - r[1].spent)
  })

  it('omits years with no activity and sorts oldest first', () => {
    const r = computeYearlySummary({
      allIncome: [inc(2026, 1, 100)], allExpenses: [exp(2024, 1, 50)], investCatIds: INVEST,
    })
    expect(r.map(x => x.year)).toEqual(['2024', '2026'])
  })
})

describe('computeHoldingsMatrix', () => {
  it('lays out items against years with a running balance', () => {
    const { years, rows, totals } = computeHoldingsMatrix({
      allExpenses: [
        iexp(2025, 6, 60000, 'SIP'),
        iexp(2026, 1, 23000, 'SIP'),
        iexp(2026, 1, 10000, 'Gold'),
        exp(2026, 1, 99999),                 // spending — excluded
      ],
      investCatIds: INVEST,
    })
    expect(years).toEqual(['2025', '2026'])
    expect(rows).toEqual([
      { name: 'SIP',  byYear: { '2025': 60000, '2026': 23000 }, balance: 83000 },
      { name: 'Gold', byYear: { '2026': 10000 },                balance: 10000 },
    ])
    expect(totals.byYear['2025']).toBe(60000)
    expect(totals.byYear['2026']).toBe(33000)
    expect(totals.balance).toBe(93000)
  })

  it('keeps an unattributed withdrawal as its own negative row', () => {
    const { rows, totals } = computeHoldingsMatrix({
      allExpenses: [iexp(2026, 1, 50000, 'SIP'), iexp(2026, 2, -20000, 'Withdraw')],
      investCatIds: INVEST,
    })
    expect(rows.map(r => [r.name, r.balance])).toEqual([['SIP', 50000], ['Withdraw', -20000]])
    expect(totals.balance).toBe(30000)
  })

  it('is empty with no investments', () => {
    const m = computeHoldingsMatrix({ allExpenses: [exp(2026, 1, 500)], investCatIds: INVEST })
    expect(m.rows).toEqual([])
    expect(m.totals.balance).toBe(0)
  })
})

describe('computePosition', () => {
  it('cash is what was kept and not put into investments', () => {
    const p = computePosition({
      allIncome:   [inc(2025, 1, 500000), inc(2026, 1, 300000)],
      allExpenses: [exp(2025, 1, 200000), iexp(2026, 1, 100000, 'SIP')],
      investCatIds: INVEST,
    })
    expect(p.earned).toBe(800000)
    expect(p.spent).toBe(200000)
    expect(p.kept).toBe(600000)       // earned − spent; investing is not spending
    expect(p.invested).toBe(100000)
    expect(p.cash).toBe(500000)       // kept − invested
    expect(p.cash + p.invested).toBe(p.kept)
  })

  it('a withdrawal moves money from investments back to cash, leaving kept alone', () => {
    const base = { allIncome: [inc(2026, 1, 100000)], investCatIds: INVEST }
    const before = computePosition({ ...base, allExpenses: [iexp(2026, 1, 40000, 'SIP')] })
    const after  = computePosition({
      ...base,
      allExpenses: [iexp(2026, 1, 40000, 'SIP'), iexp(2026, 2, -15000, 'SIP')],
    })
    expect(after.invested).toBe(before.invested - 15000)
    expect(after.cash).toBe(before.cash + 15000)
    expect(after.kept).toBe(before.kept)   // no money entered or left your world
  })

  it('goes negative when more was invested than was kept', () => {
    const p = computePosition({
      allIncome:   [inc(2026, 1, 100000)],
      allExpenses: [exp(2026, 1, 90000), iexp(2026, 1, 30000, 'SIP')],
      investCatIds: INVEST,
    })
    expect(p.kept).toBe(10000)
    expect(p.cash).toBe(-20000)
  })
})

describe('computeHoldingsWithBalance', () => {
  const rows = [
    iexp(2025, 6, 24323, 'Gold'),    // earlier year
    iexp(2026, 3,  4177, 'Gold'),    // this period
    iexp(2026, 4, -11861, 'Gold'),   // withdrawal bigger than this year's deposits
    iexp(2026, 3, 20000, 'SIP'),
    iexp(2026, 11, 99999, 'Gold'),   // after the period
    exp(2026, 3, 50000),             // spending
  ]

  it('period can be negative while the balance stays positive', () => {
    const gold = computeHoldingsWithBalance({
      allExpenses: rows, investCatIds: INVEST,
      fromKey: monthKey(2026, 1), toKey: monthKey(2026, 8),
    }).find(x => x.name === 'Gold')
    expect(gold.period).toBe(-7684)     // 4177 − 11861 — looks broken on its own
    expect(gold.balance).toBe(16639)    // 24323 + 4177 − 11861 — the pot is fine
  })

  it('excludes anything after the period end from BOTH figures', () => {
    const gold = computeHoldingsWithBalance({
      allExpenses: rows, investCatIds: INVEST,
      fromKey: monthKey(2026, 1), toKey: monthKey(2026, 8),
    }).find(x => x.name === 'Gold')
    expect(gold.balance).not.toBe(16639 + 99999)
  })

  it('with no start bound, period equals balance', () => {
    computeHoldingsWithBalance({
      allExpenses: rows, investCatIds: INVEST, toKey: monthKey(2026, 8),
    }).forEach(x => expect(x.period).toBe(x.balance))
  })

  it('is empty with no period', () => {
    expect(computeHoldingsWithBalance({
      allExpenses: rows, investCatIds: INVEST, toKey: null,
    })).toEqual([])
  })
})
