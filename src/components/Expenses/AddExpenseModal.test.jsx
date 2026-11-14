// @vitest-environment jsdom
// Render smoke tests for the two amount modals.
//
// They exist for a specific reason: a missing variable inside JSX is valid
// syntax, so `vite build` compiles it happily and the crash only appears when a
// user opens the component. That is exactly what happened — clicking Edit threw
// "ReferenceError: adjusted is not defined" against a green build and a green
// test suite. Rendering each modal in every mode catches that in CI.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('AddExpenseModal item-name suggestions', () => {
  const SUGG = [{ name: 'SIP', categoryId: 'c_inv' }, { name: 'Old thing', categoryId: 'c_gone' }]
  const itemInput = () => screen.getByPlaceholderText('e.g. Electricity Bill')
  // Native select: the MUI label is not wired to it, so find it by its placeholder option.
  const categorySelect = () => screen.getByRole('option', { name: '-- Select Category --' }).closest('select')
  const categoryValue = () => categorySelect().value
  const typeItem = (v) => fireEvent.change(itemInput(), { target: { value: v } })

  it('offers past names through a datalist on the Item Name field', () => {
    render(<AddExpenseModal categories={CATS} year={2026} month={9} suggestions={SUGG}
      onSave={noop} onClose={noop} />)
    const list = document.getElementById(itemInput().getAttribute('list'))
    expect([...list.options].map(o => o.value)).toEqual(['SIP', 'Old thing'])
  })

  it('switches to the category the name was last used in (case-insensitive)', () => {
    render(<AddExpenseModal categories={CATS} year={2026} month={9} suggestions={SUGG}
      onSave={noop} onClose={noop} />)
    expect(categoryValue()).toBe('c_food')
    typeItem('sip')
    expect(categoryValue()).toBe('c_inv')
  })

  it('ignores a suggestion whose category no longer exists', () => {
    render(<AddExpenseModal categories={CATS} year={2026} month={9} suggestions={SUGG}
      onSave={noop} onClose={noop} />)
    typeItem('Old thing')
    expect(categoryValue()).toBe('c_food')
  })

  it('does not switch when opened for a specific category', () => {
    render(<AddExpenseModal initial={{ categoryId: 'c_food' }} categories={CATS} year={2026} month={9}
      suggestions={SUGG} onSave={noop} onClose={noop} />)
    typeItem('SIP')
    expect(categoryValue()).toBe('c_food')
  })

  it('does not switch after the user picked a category by hand', () => {
    const cats = [...CATS, { id: 'c_misc', name: 'Misc', type: 'expense' }]
    render(<AddExpenseModal categories={cats} year={2026} month={9} suggestions={SUGG}
      onSave={noop} onClose={noop} />)
    fireEvent.change(categorySelect(), { target: { value: 'c_misc' } })
    typeItem('SIP')
    expect(categoryValue()).toBe('c_misc')
  })

  it('does not switch when editing an existing expense', () => {
    render(<AddExpenseModal initial={expenseRow()} categories={CATS} year={2026} month={9}
      suggestions={SUGG} onSave={noop} onClose={noop} />)
    typeItem('SIP')
    expect(categoryValue()).toBe('c_food')
  })
})

describe('AddExpenseModal More options', () => {
  const toggle = () => screen.getByRole('button', { name: /More options/ })

  it('starts collapsed and names a non-default apply mode on the toggle', async () => {
    const onSave = vi.fn()
    render(<AddExpenseModal categories={CATS} year={2026} month={9} onSave={onSave} onClose={noop} />)
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(toggle().textContent).toBe('▸ More options')

    fireEvent.click(toggle())
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Whole year' }))
    fireEvent.click(toggle())
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    expect(toggle().textContent).toContain('More options · Whole year')

    fireEvent.change(screen.getByPlaceholderText('e.g. Electricity Bill'), { target: { value: 'Rent' } })
    fireEvent.change(amountInput(), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][1]).toBe('all_year')
  })

  it('saves to this month only by default', async () => {
    const onSave = vi.fn()
    render(<AddExpenseModal categories={CATS} year={2026} month={9} onSave={onSave} onClose={noop} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Electricity Bill'), { target: { value: 'Rent' } })
    fireEvent.change(amountInput(), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Expense' }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][1]).toBe('single')
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

  it('offers past custom sources through a datalist on the Custom Source field', () => {
    render(<AddIncomeModal
      initial={{ id: 'i1', year: 2026, month: 9, source: 'Rent', amount: '9000', date: '2026-09-01' }}
      year={2026} month={9} suggestions={['Rent', 'Bonus']} onSave={noop} onClose={noop} />)
    const input = screen.getByDisplayValue('Rent')
    const list = document.getElementById(input.getAttribute('list'))
    expect([...list.options].map(o => o.value)).toEqual(['Rent', 'Bonus'])
  })
})
