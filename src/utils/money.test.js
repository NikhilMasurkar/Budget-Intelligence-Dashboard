import { describe, it, expect } from 'vitest'
import {
  SAVINGS_TYPE, EXPENSE_TYPE,
  isInvestmentCategory, investmentCategoryIds, splitSpendInvest, splitWithdrawal,
  applyAmountExpression,
} from './money'

const CATS = [
  { id: 'c_food', name: 'Food',        type: EXPENSE_TYPE },
  { id: 'c_rent', name: 'Rent',        type: EXPENSE_TYPE },
  { id: 'c_inv',  name: 'Investments', type: SAVINGS_TYPE },
]

describe('isInvestmentCategory', () => {
  it('keys off the explicit type, never the name', () => {
    expect(isInvestmentCategory({ type: SAVINGS_TYPE })).toBe(true)
    expect(isInvestmentCategory({ type: EXPENSE_TYPE })).toBe(false)
    // A category NAMED like an investment but typed as an expense is spending.
    // The AI layer used to name-match here and disagreed with everywhere else.
    expect(isInvestmentCategory({ name: 'My Investments', type: EXPENSE_TYPE })).toBe(false)
    expect(isInvestmentCategory({ name: 'Savings jar',    type: EXPENSE_TYPE })).toBe(false)
  })

  it('is safe on missing categories', () => {
    expect(isInvestmentCategory(undefined)).toBe(false)
    expect(isInvestmentCategory(null)).toBe(false)
    expect(isInvestmentCategory({})).toBe(false)
  })
})

describe('investmentCategoryIds', () => {
  it('returns only investment ids', () => {
    const ids = investmentCategoryIds(CATS)
    expect(ids.has('c_inv')).toBe(true)
    expect(ids.has('c_food')).toBe(false)
    expect(ids.size).toBe(1)
  })

  it('handles no categories', () => {
    expect(investmentCategoryIds().size).toBe(0)
    expect(investmentCategoryIds([]).size).toBe(0)
  })
})

describe('splitSpendInvest', () => {
  it('keeps investing out of spending', () => {
    const { spend, invest } = splitSpendInvest([
      { categoryId: 'c_food', amount: '40000' },
      { categoryId: 'c_rent', amount: '28000' },
      { categoryId: 'c_inv',  amount: '30000' },
    ], CATS)
    expect(spend).toBe(68000)
    expect(invest).toBe(30000)
  })

  it('nets withdrawals against deposits; invest can go negative', () => {
    const { spend, invest } = splitSpendInvest([
      { categoryId: 'c_inv',  amount: '10000' },
      { categoryId: 'c_inv',  amount: '-25000' },   // withdrawal
      { categoryId: 'c_food', amount: '5000' },
    ], CATS)
    expect(invest).toBe(-15000)
    // A withdrawal must never reduce spending — that was the original bug.
    expect(spend).toBe(5000)
  })

  it('treats an unknown category as spending, not investing', () => {
    const { spend, invest } = splitSpendInvest(
      [{ categoryId: 'deleted_cat', amount: '900' }], CATS
    )
    expect(spend).toBe(900)
    expect(invest).toBe(0)
  })

  it('adding an investment never changes the spending total', () => {
    const rows = [{ categoryId: 'c_food', amount: '40000' }]
    const before = splitSpendInvest(rows, CATS).spend
    const after  = splitSpendInvest([...rows, { categoryId: 'c_inv', amount: '99999' }], CATS).spend
    expect(after).toBe(before)
  })

  it('coerces bad amounts to zero instead of NaN', () => {
    const { spend, invest } = splitSpendInvest([
      { categoryId: 'c_food', amount: '' },
      { categoryId: 'c_food', amount: undefined },
      { categoryId: 'c_inv',  amount: 'abc' },
    ], CATS)
    expect(spend).toBe(0)
    expect(invest).toBe(0)
  })
})

describe('splitWithdrawal', () => {
  const H = [{ name: 'SIP', balance: 80000 }, { name: 'Gold', balance: 20000 }]

  it('splits in proportion to each balance', () => {
    expect(splitWithdrawal(10000, H)).toEqual([
      { name: 'SIP',  amount: 8000 },
      { name: 'Gold', amount: 2000 },
    ])
  })

  it('parts always sum exactly to the amount, even when it does not divide evenly', () => {
    const parts = splitWithdrawal(10000, [
      { name: 'A', balance: 33333 }, { name: 'B', balance: 33333 }, { name: 'C', balance: 33334 },
    ])
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(10000)
  })

  it('ignores holdings that are empty or already negative', () => {
    expect(splitWithdrawal(1000, [
      { name: 'SIP', balance: 5000 }, { name: 'Empty', balance: 0 }, { name: 'Owed', balance: -900 },
    ])).toEqual([{ name: 'SIP', amount: 1000 }])
  })

  it('returns nothing when there is nothing to take from', () => {
    expect(splitWithdrawal(1000, [])).toEqual([])
    expect(splitWithdrawal(1000, [{ name: 'A', balance: 0 }])).toEqual([])
    expect(splitWithdrawal(0, H)).toEqual([])
  })
})

describe('applyAmountExpression', () => {
  it('adjusts the existing amount when given an operator', () => {
    expect(applyAmountExpression(5000, '+200').value).toBe(5200)
    expect(applyAmountExpression(5000, '-10').value).toBe(4990)
    expect(applyAmountExpression(5000, '*2').value).toBe(10000)
    expect(applyAmountExpression(5000, '/2').value).toBe(2500)
  })

  it('replaces the amount when given a bare number', () => {
    const r = applyAmountExpression(5000, '750')
    expect(r.value).toBe(750)
    expect(r.op).toBeNull()
  })

  it('reports the operator and operand so the change can be logged', () => {
    expect(applyAmountExpression(5000, '+200')).toEqual({ value: 5200, op: '+', operand: 200 })
  })

  it('handles decimals and ignores surrounding spaces', () => {
    expect(applyAmountExpression(100, ' + 20.5 ').value).toBe(120.5)
    expect(applyAmountExpression(10, '/3').value).toBe(3.33)   // 2dp, matching storage
  })

  it('treats a missing base as zero, so expressions work on a new expense', () => {
    expect(applyAmountExpression(0, '+200').value).toBe(200)
    expect(applyAmountExpression(undefined, '+200').value).toBe(200)
  })

  it('returns null for anything unparseable rather than guessing', () => {
    expect(applyAmountExpression(5000, '')).toBeNull()
    expect(applyAmountExpression(5000, '+')).toBeNull()
    expect(applyAmountExpression(5000, 'abc')).toBeNull()
    expect(applyAmountExpression(5000, '+abc')).toBeNull()
    expect(applyAmountExpression(5000, '/0')).toBeNull()
  })
})
