// @vitest-environment jsdom
// Render smoke tests for the two amount modals.
//
// They exist for a specific reason: a missing variable inside JSX is valid
// syntax, so `vite build` compiles it happily and the crash only appears when a
// user opens the component. That is exactly what happened — clicking Edit threw
// "ReferenceError: adjusted is not defined" against a green build and a green
// test suite. Rendering each modal in every mode catches that in CI.
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AddExpenseModal from './AddExpenseModal'
import AddIncomeModal from '../Income/AddIncomeModal'

const CATS = [
  { id: 'c_food', name: 'Food', type: 'expense' },
  { id: 'c_inv',  name: 'Investments', type: 'savings' },
]
const noop = () => {}
const HOLDINGS = [{ name: 'SIP', balance: 50000 }, { name: 'Gold', balance: 20000 }]

const expenseRow = (over = {}) => ({
  id: 'e1', year: 2026, month: 9, categoryId: 'c_food',
  itemName: 'Rent', amount: '5000', isFixed: 'FALSE', note: '', ...over,
})

// The amount field is the one the keypad drives, marked inputMode="none".
const amountInput = () => document.querySelector('input[inputmode="none"]')

describe('AddExpenseModal renders', () => {
  it('in add mode', () => {
    expect(() =>
      render(<AddExpenseModal categories={CATS} year={2026} month={9} onSave={noop} onClose={noop} />)
    ).not.toThrow()
  })

  it('in edit mode — the path that threw "adjusted is not defined"', () => {
    expect(() =>
      render(<AddExpenseModal initial={expenseRow()} categories={CATS} year={2026} month={9}
        onSave={noop} onClose={noop} />)
    ).not.toThrow()
  })

  it('in withdraw mode on a savings category', () => {
    expect(() =>
      render(<AddExpenseModal
        initial={expenseRow({ categoryId: 'c_inv', itemName: 'SIP', amount: '-500' })}
        categories={CATS} year={2026} month={9} holdings={HOLDINGS}
        onSave={noop} onClose={noop} />)
    ).not.toThrow()
  })
})

describe('AddExpenseModal amount expressions', () => {
  it('resolves "+200" against the amount the row opened with', () => {
    render(<AddExpenseModal initial={expenseRow()} categories={CATS} year={2026} month={9}
      onSave={noop} onClose={noop} />)

    fireEvent.change(amountInput(), { target: { value: '+200' } })
    // ₹5,000 + 200 = ₹5,200 — shown before saving so it is never a guess.
    expect(screen.getAllByText(/5,200/).length).toBeGreaterThan(0)
  })

  it('says so when the field cannot be read, rather than saving zero', () => {
    render(<AddExpenseModal initial={expenseRow()} categories={CATS} year={2026} month={9}
      onSave={noop} onClose={noop} />)

    fireEvent.change(amountInput(), { target: { value: '1+2+3' } })
    expect(screen.getAllByText(/Can't read that/).length).toBeGreaterThan(0)
  })
})

describe('AddIncomeModal renders', () => {
  it('in add mode', () => {
    expect(() =>
      render(<AddIncomeModal year={2026} month={9} onSave={noop} onClose={noop} />)
    ).not.toThrow()
  })

  it('in edit mode', () => {
    expect(() =>
      render(<AddIncomeModal
        initial={{ id: 'i1', year: 2026, month: 9, source: 'Salary', amount: '65000', date: '2026-09-01' }}
        year={2026} month={9} onSave={noop} onClose={noop} />)
    ).not.toThrow()
  })

  it('resolves an expression against the existing amount', () => {
    render(<AddIncomeModal
      initial={{ id: 'i1', year: 2026, month: 9, source: 'Salary', amount: '65000', date: '2026-09-01' }}
      year={2026} month={9} onSave={noop} onClose={noop} />)

    fireEvent.change(amountInput(), { target: { value: '+200' } })
    expect(screen.getAllByText(/65,200/).length).toBeGreaterThan(0)
  })
})
