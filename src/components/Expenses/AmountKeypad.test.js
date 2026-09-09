import { describe, it, expect } from 'vitest'
import { nextAmountInput } from './AmountKeypad'

describe('nextAmountInput', () => {
  it('builds a leading-operator adjustment', () => {
    expect(nextAmountInput('', '+')).toBe('+')
    expect(nextAmountInput('+', '2')).toBe('+2')
    expect(nextAmountInput('+2', '0')).toBe('+20')
  })

  it('builds plain infix from a number', () => {
    expect(nextAmountInput('500', '+')).toBe('500+')
    expect(nextAmountInput('500+', '2')).toBe('500+2')
  })

  it('swaps a trailing operator instead of stacking', () => {
    expect(nextAmountInput('500+', '*')).toBe('500*')
    expect(nextAmountInput('+', '-')).toBe('-')
  })

  it('refuses a second operator — it would strand the field unparseable', () => {
    expect(nextAmountInput('+200', '+')).toBeNull()
    expect(nextAmountInput('500+200', '*')).toBeNull()
  })

  it('allows one decimal point per number', () => {
    expect(nextAmountInput('1', '.')).toBe('1.')
    expect(nextAmountInput('1.5', '.')).toBeNull()
    expect(nextAmountInput('1.5+2', '.')).toBe('1.5+2.')   // second operand may have its own
  })

  it('appends digits normally', () => {
    expect(nextAmountInput('', '7')).toBe('7')
    expect(nextAmountInput('12', '3')).toBe('123')
  })
})
