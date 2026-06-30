import { describe, it, expect } from 'vitest'
import { fmt, fmtK, toSentenceCase, defaultMonths, YEAR_NOW, MONTH_NOW } from './constants'

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
