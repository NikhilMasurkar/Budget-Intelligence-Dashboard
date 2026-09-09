import { describe, it, expect } from 'vitest'
import { fmt, fmtK, toSentenceCase, defaultMonths, dateForMonth, YEAR_NOW, MONTH_NOW } from './constants'

describe('fmt', () => {
  it('formats positive rupees with grouping', () => {
    expect(fmt(150000)).toBe('₹1,50,000')   // Indian grouping
    expect(fmt(0)).toBe('₹0')
  })
  it('formats negatives with a leading minus before the symbol', () => {
    expect(fmt(-2500)).toBe('-₹2,500')
  })
  it('rounds to whole rupees and coerces junk to 0', () => {
    expect(fmt(99.6)).toBe('₹100')
    expect(fmt('abc')).toBe('₹0')
    expect(fmt(null)).toBe('₹0')
  })
})

describe('fmtK', () => {
  it('uses K / L suffixes', () => {
    expect(fmtK(1500)).toBe('₹1.5K')
    expect(fmtK(150000)).toBe('₹1.5L')
    expect(fmtK(500)).toBe('₹500')
  })
  it('carries the sign for negatives (withdrawals)', () => {
    expect(fmtK(-150000)).toBe('-₹1.5L')
    expect(fmtK(-1500)).toBe('-₹1.5K')
    expect(fmtK(-500)).toBe('-₹500')
  })
})

describe('toSentenceCase', () => {
  it('capitalises first letter, lowercases the rest', () => {
    expect(toSentenceCase('HELLO WORLD')).toBe('Hello world')
    expect(toSentenceCase('electricity bill')).toBe('Electricity bill')
  })
  it('trims and collapses internal whitespace', () => {
    expect(toSentenceCase('  rent   home  ')).toBe('Rent home')
  })
  it('handles empty / nullish', () => {
    expect(toSentenceCase('')).toBe('')
    expect(toSentenceCase(null)).toBe('')
    expect(toSentenceCase('   ')).toBe('')
  })
})

describe('defaultMonths', () => {
  it('current year → Jan..current month inclusive (MONTH_NOW is 0-indexed)', () => {
    expect(defaultMonths(YEAR_NOW)).toEqual([...Array(MONTH_NOW + 1).keys()])
    expect(defaultMonths(YEAR_NOW).length).toBe(MONTH_NOW + 1)
  })
  it('past year → all 12 months', () => {
    expect(defaultMonths(2000)).toEqual([...Array(12).keys()])
  })
})

describe('dateForMonth', () => {
  it('moves the date onto the given month, keeping the day', () => {
    expect(dateForMonth('2026-09-15', 1)).toBe('2026-01-15')
    expect(dateForMonth('2026-09-15', 12)).toBe('2026-12-15')
  })

  it('clamps a day that does not exist in the target month', () => {
    expect(dateForMonth('2026-01-31', 2)).toBe('2026-02-28')   // 2026 not a leap year
    expect(dateForMonth('2024-01-31', 2)).toBe('2024-02-29')   // 2024 is
    expect(dateForMonth('2026-03-31', 4)).toBe('2026-04-30')
  })

  it('returns empty for missing or unparseable input', () => {
    expect(dateForMonth('', 3)).toBe('')
    expect(dateForMonth(undefined, 3)).toBe('')
    expect(dateForMonth('not-a-date', 3)).toBe('')
  })
})

describe('defaultMonths', () => {
  it('gives Jan..current month for the current year, and all 12 for a past one', () => {
    const now = new Date()
    expect(defaultMonths(now.getFullYear())).toHaveLength(now.getMonth() + 1)
    expect(defaultMonths(now.getFullYear() - 1)).toHaveLength(12)
  })

  it('treats a future year like the current one, and accepts a string year', () => {
    const now = new Date()
    expect(defaultMonths(now.getFullYear() + 1)).toHaveLength(now.getMonth() + 1)
    expect(defaultMonths(String(now.getFullYear()))).toHaveLength(now.getMonth() + 1)
  })
})
