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

  it('allows more steps after the first, so several values add in one go', () => {
    expect(nextAmountInput('+200', '+')).toBe('+200+')
    expect(nextAmountInput('500+200', '*')).toBe('500+200*')
    expect(nextAmountInput('500+200+', '-')).toBe('500+200-')   // still swaps, never stacks
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
