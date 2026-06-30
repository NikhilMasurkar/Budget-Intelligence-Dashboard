import { describe, it, expect } from 'vitest'
import { calcInstantScore, calcIncomeTax, buildFinancialContext } from './gemini'

const CATS = [
  { id: 'c_food', name: 'Food', type: 'expense' },
  { id: 'c_inv', name: 'Investments & Savings', type: 'savings' },
]

describe('calcIncomeTax (India new regime FY25-26)', () => {
  it('is zero up to ₹12L taxable (rebate u/s 87A, ₹75k std deduction)', () => {
    expect(calcIncomeTax(1000000)).toBe(0)
    expect(calcIncomeTax(1275000)).toBe(0) // taxable = 12L exactly
  })
  it('20% slab between 12L and 16L taxable', () => {
    expect(calcIncomeTax(1675000)).toBe(80000) // taxable 16L → (16-12)L*20%
  })
  it('25% slab between 16L and 20L taxable', () => {
    expect(calcIncomeTax(2075000)).toBe(180000) // taxable 20L → 80k + (20-16)L*25%
  })
  it('30% slab above 20L taxable', () => {
    expect(calcIncomeTax(2575000)).toBe(330000) // taxable 25L → 180k + (25-20)L*30%
  })
})

describe('calcInstantScore', () => {
  it('healthy saver: scores high, reports savings rate + employment', () => {
    const r = calcInstantScore({
      categories: CATS,
      income: [{ month: '1', source: 'Salary', amount: '100000' }],
      expenses: [
        { month: '1', categoryId: 'c_food', amount: '40000' },
        { month: '1', categoryId: 'c_inv', amount: '20000' },
      ],
      selMonths: [0],
    })
    expect(r.employment).toBe('salaried')
    expect(r.score).toBe(8) // base 5 +2 (>=20% saved) +1 (has investments)
    expect(r.summary).toContain('Saving 40%')
  })

  it('deficit: scores low and says spending over income', () => {
    const r = calcInstantScore({
      categories: CATS,
      income: [{ month: '1', source: 'Freelance', amount: '50000' }],
      expenses: [{ month: '1', categoryId: 'c_food', amount: '80000' }],
      selMonths: [0],
    })
    expect(r.employment).toBe('freelancer')
    expect(r.score).toBeLessThan(5)
    expect(r.summary.toLowerCase()).toContain('more than you earn')
  })

  it('no income → explicit message', () => {
    const r = calcInstantScore({
      categories: CATS,
      income: [],
      expenses: [{ month: '1', categoryId: 'c_food', amount: '5000' }],
      selMonths: [0],
    })
    expect(r.summary).toBe('No income recorded for this period.')
  })

  it('only counts months inside the selected range', () => {
    const r = calcInstantScore({
      categories: CATS,
      income: [
        { month: '1', source: 'Salary', amount: '100000' },
        { month: '6', source: 'Salary', amount: '999999' }, // outside selMonths
      ],
      expenses: [{ month: '1', categoryId: 'c_food', amount: '40000' }],
      selMonths: [0], // only January
    })
    // June income must not leak in
    expect(r.summary).toContain('Saving')
    expect(r.summary).not.toContain('999')
  })
})

describe('buildFinancialContext', () => {
  it('produces a prompt with the user name and monthly figures', () => {
    const ctx = buildFinancialContext({
      categories: CATS,
      income: [{ month: '1', source: 'Salary', amount: '100000' }],
      expenses: [{ month: '1', categoryId: 'c_food', amount: '40000' }],
      selMonths: [0],
      year: 2030,
      userName: 'Nikhil',
    })
    expect(ctx).toContain('Nikhil')
    expect(ctx).toContain('2030')
    expect(ctx).toMatch(/Monthly income/i)
    expect(ctx).toContain('Food')
  })
})
