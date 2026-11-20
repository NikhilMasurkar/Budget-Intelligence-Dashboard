// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { restoreBackup } = vi.hoisted(() => ({ restoreBackup: vi.fn(async () => {}) }))
vi.mock('../api/store', () => ({ restoreBackup }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }))

import RestoreBackup from './RestoreBackup'

const file = (obj) => new File([JSON.stringify(obj)], 'b.json', { type: 'application/json' })
const backup = { app: 'BudgetIQ', exportedAt: '2026-11-22T03:30:00Z', categories: [{ id: 'food' }],
  expenses: [{ id: 'e1', year: 2026, month: 11, itemName: 'Tea', amount: 40 }], income: [] }

describe('RestoreBackup', () => {
  it('shows what the file holds, saves current data first, then restores', async () => {
    const onBefore = vi.fn(), onRestored = vi.fn()
    render(<RestoreBackup onBeforeRestore={onBefore} onRestored={onRestored} />)
    fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [file(backup)] } })
    await screen.findByText(/Replace all your data/)
    expect(screen.getByText(/1 expenses, 0 income entries, 1 categories/)).toBeTruthy()
    expect(restoreBackup).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, restore' }))
    await waitFor(() => expect(onRestored).toHaveBeenCalled())
    expect(onBefore).toHaveBeenCalled()
    expect(restoreBackup.mock.calls[0][0].expenses[0]).toMatchObject({ id: 'e1', year: '2026', month: '11' })
  })

  it('never restores a bad file', async () => {
    restoreBackup.mockClear()
    render(<RestoreBackup onBeforeRestore={vi.fn()} onRestored={vi.fn()} />)
    fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [file({ ...backup, expenses: [] })] } })
    await new Promise(r => setTimeout(r, 50))
    expect(screen.queryByText(/Replace all your data/)).toBeNull()
    expect(restoreBackup).not.toHaveBeenCalled()
  })
})
