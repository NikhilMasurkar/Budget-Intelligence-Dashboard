// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CATEGORIES, EXPENSES, INCOME, YEAR, MONTH, noop, handlers } from '../../test/fixtures'
import ExpensesByCategory from './ExpensesByCategory'
import ExpenseCommentsModal from './ExpenseCommentsModal'
import AmountKeypad from './AmountKeypad'

const year2026 = EXPENSES.filter(e => e.year === '2026')

const props = {
  ...handlers,                       // every callback is a noop
  expenses: year2026,
  income: INCOME.filter(i => i.year === '2026'),
  categories: CATEGORIES,
  year: YEAR, month: MONTH,
  availableYears: [2025, 2026],
  selectedIds: [],
  canEdit: true,
}

describe('ExpensesByCategory', () => {
  it('renders with data, spanning spending, investments and an orphaned row', () => {
    expect(() => render(<ExpensesByCategory {...props} />)).not.toThrow()
  })

  it('renders with nothing recorded for the month', () => {
    expect(() => render(<ExpensesByCategory {...props} expenses={[]} income={[]} />)).not.toThrow()
  })

  it('renders with no categories configured', () => {
    expect(() => render(<ExpensesByCategory {...props} categories={[]} />)).not.toThrow()
  })

  it('renders read-only, as a locked past year does', () => {
    expect(() => render(<ExpensesByCategory {...props} canEdit={false} />)).not.toThrow()
  })

  it('renders with rows selected, which reveals the bulk action bar', () => {
    expect(() => render(<ExpensesByCategory {...props} selectedIds={['e1', 'e2']} />)).not.toThrow()
  })

  it('renders when income is zero — the summary divides by it', () => {
    expect(() => render(<ExpensesByCategory {...props} income={[]} />)).not.toThrow()
  })
})

describe('ExpenseCommentsModal', () => {
  it('renders an existing thread', () => {
    expect(() => render(
      <ExpenseCommentsModal
        expense={{ itemName: 'Groceries', note: '[{"text":"weekly shop","ts":1}]' }}
        onClose={noop} onSave={noop} saving={false} />
    )).not.toThrow()
  })

  it('renders with no comments yet', () => {
    expect(() => render(
      <ExpenseCommentsModal expense={{ itemName: 'Rent', note: '' }}
        onClose={noop} onSave={noop} saving={false} />
    )).not.toThrow()
  })

  it('renders a legacy plain-string note', () => {
    expect(() => render(
      <ExpenseCommentsModal expense={{ itemName: 'Rent', note: 'paid in cash' }}
        onClose={noop} onSave={noop} saving={false} />
    )).not.toThrow()
  })

  it('renders while saving', () => {
    expect(() => render(
      <ExpenseCommentsModal expense={{ itemName: 'Rent', note: '' }}
        onClose={noop} onSave={noop} saving={true} />
    )).not.toThrow()
  })
})

describe('AmountKeypad', () => {
  it('renders empty and with a pending expression', () => {
    expect(() => render(
      <AmountKeypad value="" onChange={noop} onDone={noop} onEquals={noop} resultLabel={null} />
    )).not.toThrow()

    expect(() => render(
      <AmountKeypad value="+200" onChange={noop} onDone={noop} onEquals={noop} resultLabel="= ₹5,200" />
    )).not.toThrow()
  })
})
