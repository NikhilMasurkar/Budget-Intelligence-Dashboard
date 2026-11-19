// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('ExpensesByCategory default expansion', () => {
  const cats = [...CATEGORIES, { id: 'c_empty', name: 'EMPTY', type: 'expense' }]
  const header = (name) => screen.getByText(name).closest('[role="button"]')
  const isOpen = (name) => header(name).getAttribute('aria-expanded') === 'true'

  it('opens categories with items this month, including Uncategorized; empty ones stay shut', () => {
    render(<ExpensesByCategory {...props} categories={cats} />)
    expect(isOpen('RENTAL HOME')).toBe(true)
    expect(isOpen('INVESTMENTS')).toBe(true)
    expect(isOpen('Uncategorized')).toBe(true)
    expect(isOpen('EMPTY')).toBe(false)
  })

  it('keeps a hand-collapsed category shut across a data reload, resets on month change', () => {
    const { rerender } = render(<ExpensesByCategory {...props} categories={cats} />)
    fireEvent.click(header('FOOD'))
    expect(isOpen('FOOD')).toBe(false)

    // loadAll rebuilds every row object — same data, new references.
    rerender(<ExpensesByCategory {...props} categories={cats} expenses={year2026.map(e => ({ ...e }))} />)
    expect(isOpen('FOOD')).toBe(false)
    expect(isOpen('RENTAL HOME')).toBe(true)

    rerender(<ExpensesByCategory {...props} categories={cats} month={MONTH - 1} />)
    rerender(<ExpensesByCategory {...props} categories={cats} />)
    expect(isOpen('FOOD')).toBe(true)
  })

  it('opens an empty category when its first item is added, leaving hand-collapsed ones shut', () => {
    const { rerender } = render(<ExpensesByCategory {...props} categories={cats} />)
    fireEvent.click(header('FOOD'))
    const added = { ...year2026[0], id: 'e_new', categoryId: 'c_empty', itemName: 'First', year: String(YEAR), month: String(MONTH) }
    rerender(<ExpensesByCategory {...props} categories={cats} expenses={[...year2026, added]} />)
    expect(isOpen('EMPTY')).toBe(true)
    expect(isOpen('FOOD')).toBe(false)
  })

  it('a filter still forces matching categories open', () => {
    render(<ExpensesByCategory {...props} categories={cats} />)
    fireEvent.click(header('FOOD'))
    fireEvent.change(screen.getByPlaceholderText('Search expenses…'), { target: { value: 'groc' } })
    expect(isOpen('FOOD')).toBe(true)
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

  const thread = '[{"text":"weekly shop","ts":1}]'

  it('keeps the typed text when a save fails, and clears it when it succeeds', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce()
    render(<ExpenseCommentsModal expense={{ itemName: 'Rent', note: '' }}
      onClose={noop} onSave={onSave} saving={false} />)
    const box = screen.getByPlaceholderText('Add a comment…')
    fireEvent.change(box, { target: { value: 'paid by card' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(box.value).toBe('paid by card')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(box.value).toBe(''))
  })

  it('deletes only on a second tap', async () => {
    const onSave = vi.fn().mockResolvedValue()
    render(<ExpenseCommentsModal expense={{ itemName: 'Rent', note: thread }}
      onClose={noop} onSave={onSave} saving={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete comment' }))
    expect(onSave).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Delete?' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.anything(), '[]'))
  })

  it('is read-only for a locked year', () => {
    render(<ExpenseCommentsModal expense={{ itemName: 'Rent', note: thread }}
      onClose={noop} onSave={noop} saving={false} canEdit={false} />)
    expect(screen.getByText('weekly shop')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Add a comment…')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete comment' })).toBeNull()
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

describe('ExpensesByCategory offline', () => {
  const thisMonth = year2026.filter(e => String(e.month) === String(MONTH))
  const pendingRow = { ...thisMonth[0], id: 'q1', itemName: 'Chai offline', pending: true }

  it('marks an expense added offline as not synced, with no edit, delete or comment', () => {
    render(<ExpensesByCategory {...props} expenses={[pendingRow]} />)
    expect(screen.getByText('⏳ Not synced')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add comment' })).toBeNull()
  })

  it('offline: adding stays available, row and category changes are hidden', () => {
    render(<ExpensesByCategory {...props} online={false} />)
    expect(screen.getByRole('button', { name: '+ Add Expense' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '+ Category' })).toBeNull()
    expect(screen.queryAllByRole('button', { name: 'Edit' })).toHaveLength(0)
    expect(screen.queryAllByRole('button', { name: 'Category options' })).toHaveLength(0)
  })

  it('online: row edits are back', () => {
    render(<ExpensesByCategory {...props} />)
    expect(screen.queryAllByRole('button', { name: 'Category options' }).length).toBeGreaterThan(0)
    // Proves the 'Edit' / 'Add comment' queries above can find something at all.
    expect(screen.queryAllByRole('button', { name: 'Edit' }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('button', { name: /comment/i }).length).toBeGreaterThan(0)
  })
})
