// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react'
import { CATEGORIES, EXPENSES, INCOME, noop, handlers } from '../test/fixtures'

// Firebase is configured from VITE_* env vars that are absent in tests, and
// these components only import it for an auth handle they never exercise here.
vi.mock('../firebase', () => ({
  auth: { currentUser: null, authStateReady: async () => {} },
  db: {},
  getFirebaseUid: () => 'uid_test',
  bridgeFirebaseAuth: async () => null,
  firebaseSignOut: async () => {},
}))

import TopBar from './TopBar'
import BalanceSheet from './BalanceSheet'
import SignInScreen from './SignInScreen'
import ConfigScreen from './ConfigScreen'
import ErrorBoundary from './ErrorBoundary'
import DeleteConfirmModal from './DeleteConfirmModal'
import CategoryModal from './Category/CategoryModal'
import IncomeTable from './Income/IncomeTable'

describe('TopBar', () => {
  afterEach(cleanup)
  const base = { ...handlers, view: 'dashboard', authd: true, loading: false,
    userName: 'Nikhil', hasAIKey: true, notifStatus: 'unsubscribed' }

  it('renders signed in', () => {
    expect(() => render(<TopBar {...base} />)).not.toThrow()
  })

  it('renders signed out', () => {
    expect(() => render(<TopBar {...base} authd={false} userName="" />)).not.toThrow()
  })

  it('renders each notification state, including the blocked one', () => {
    for (const s of ['unsubscribed', 'subscribed', 'denied', 'loading', 'unsupported']) {
      expect(() => render(<TopBar {...base} notifStatus={s} />), s).not.toThrow()
    }
  })

  it('renders on the balance sheet tab, and while refreshing', () => {
    expect(() => render(<TopBar {...base} view="balance" loading={true} />)).not.toThrow()
  })

  it('bottom nav switches view and marks the active tab', () => {
    const setView = vi.fn()
    render(<TopBar {...base} setView={setView} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('button', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page')
    fireEvent.click(within(nav).getByRole('button', { name: 'Transactions' }))
    expect(setView).toHaveBeenCalledWith('expenses')
  })

  it('add button calls its handler, and is absent without one or when signed out', () => {
    const onAddExpense = vi.fn()
    const { unmount } = render(<TopBar {...base} onAddExpense={onAddExpense} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add expense' }))
    expect(onAddExpense).toHaveBeenCalledTimes(1)
    unmount()
    render(<TopBar {...base} authd={false} />)
    expect(screen.queryByRole('button', { name: 'Add expense' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
  })

  it('avatar menu lists the moved actions with labels', () => {
    render(<TopBar {...base} />)
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    for (const name of ['Refresh data', 'Download PDF', 'Daily 10 PM reminder: Off']) {
      expect(screen.getByRole('menuitem', { name })).toBeTruthy()
    }
  })
})

describe('BalanceSheet', () => {
  it('renders across two years, with a withdrawal', () => {
    expect(() => render(
      <BalanceSheet allExpenses={EXPENSES} allIncome={INCOME} categories={CATEGORIES} />
    )).not.toThrow()
  })

  it('renders the empty state', () => {
    expect(() => render(
      <BalanceSheet allExpenses={[]} allIncome={[]} categories={CATEGORIES} />
    )).not.toThrow()
  })

  it('renders when a pot has been fully withdrawn to zero', () => {
    const closed = [
      { id: 'a', year: '2025', month: '1', categoryId: 'c_inv', itemName: 'SIP', amount: '50000' },
      { id: 'b', year: '2026', month: '1', categoryId: 'c_inv', itemName: 'SIP', amount: '-50000' },
    ]
    expect(() => render(
      <BalanceSheet allExpenses={closed} allIncome={INCOME} categories={CATEGORIES} />
    )).not.toThrow()
  })

  it('stacks the tables on a phone, with the same figures', () => {
    const wide = render(<BalanceSheet allExpenses={EXPENSES} allIncome={INCOME} categories={CATEGORIES} />)
    const wideText = wide.container.textContent
    cleanup()
    vi.stubGlobal('matchMedia', q => ({
      matches: true, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
    }))
    render(<BalanceSheet allExpenses={EXPENSES} allIncome={INCOME} categories={CATEGORIES} />)
    vi.unstubAllGlobals()
    expect(screen.getAllByText('Cash left').length).toBeGreaterThan(1)   // a label per year block
    expect(screen.getByText('All years')).toBeTruthy()
    // every rupee figure on the wide layout also appears on the phone layout
    for (const amt of wideText.match(/−?₹[\d,]+/g)) expect(document.body.textContent).toContain(amt)
  })
})

describe('screens and banners', () => {
  it('SignInScreen renders', () => {
    expect(() => render(<SignInScreen onSignIn={noop} />)).not.toThrow()
  })

  it('ConfigScreen renders', () => {
    expect(() => render(<ConfigScreen />)).not.toThrow()
  })

  it('ErrorBoundary renders its children', () => {
    expect(() => render(<ErrorBoundary><div>ok</div></ErrorBoundary>)).not.toThrow()
  })
})

describe('modals', () => {
  it('DeleteConfirmModal renders for each type', () => {
    for (const [type, item] of [
      ['expense', { itemName: 'Rent', amount: '15000', year: '2026' }],
      ['income',  { source: 'Salary', amount: '65275', year: '2026' }],
      ['category',{ name: 'FOOD', id: 'c_food' }],
    ]) {
      expect(() => render(
        <DeleteConfirmModal open item={item} type={type} onDelete={noop} onClose={noop} />
      ), type).not.toThrow()
    }
  })

  it('CategoryModal renders new and editing, for both category types', () => {
    expect(() => render(
      <CategoryModal open categories={CATEGORIES} onSave={noop} onClose={noop} />
    )).not.toThrow()

    expect(() => render(
      <CategoryModal open initial={CATEGORIES[0]} categories={CATEGORIES} onSave={noop} onClose={noop} />
    )).not.toThrow()

    expect(() => render(
      <CategoryModal open initial={CATEGORIES[2]} categories={CATEGORIES} onSave={noop} onClose={noop} />
    )).not.toThrow()
  })
})

describe('IncomeTable', () => {
  it('renders rows, empty, and read-only', () => {
    expect(() => render(<IncomeTable income={INCOME} onEdit={noop} onDelete={noop} canEdit />)).not.toThrow()
    expect(() => render(<IncomeTable income={[]} onEdit={noop} onDelete={noop} canEdit />)).not.toThrow()
    expect(() => render(
      <IncomeTable income={INCOME} onEdit={noop} onDelete={noop} canEdit={false} />
    )).not.toThrow()
  })

  it('renders a row with no date recorded', () => {
    expect(() => render(
      <IncomeTable income={[{ id: 'x', year: '2026', month: '9', source: 'Bonus', amount: '5000' }]}
        onEdit={noop} onDelete={noop} canEdit />
    )).not.toThrow()
  })
})
