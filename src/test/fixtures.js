// Shared data for render smoke tests. Deliberately realistic rather than
// minimal: a spending category and an investment one, a pinned row, a
// withdrawal, and a comment thread — the shapes that have actually produced
// crashes and wrong numbers in this app.

export const CATEGORIES = [
  { id: 'c_rent', name: 'RENTAL HOME', type: 'expense', color: '#2A9D8F', order: 0, budget: 20000 },
  { id: 'c_food', name: 'FOOD',        type: 'expense', color: '#E76F51', order: 1, budget: 0 },
  { id: 'c_inv',  name: 'INVESTMENTS', type: 'savings', color: '#8338EC', order: 2 },
]

export const EXPENSES = [
  { id: 'e1', year: '2026', month: '9', categoryId: 'c_rent', itemName: 'Rent',
    amount: '15000', isFixed: 'TRUE', note: '', updatedAt: 'U1' },
  { id: 'e2', year: '2026', month: '9', categoryId: 'c_food', itemName: 'Groceries',
    amount: '4200.55', isFixed: 'FALSE', note: '[{"text":"weekly shop","ts":1}]', updatedAt: 'U2' },
  { id: 'e3', year: '2026', month: '9', categoryId: 'c_inv', itemName: 'Mutual fund',
    amount: '5000', isFixed: 'FALSE', note: '', updatedAt: 'U3' },
  // A withdrawal — negative row in a savings category.
  { id: 'e4', year: '2026', month: '9', categoryId: 'c_inv', itemName: 'Gold saving',
    amount: '-2000', isFixed: 'FALSE', note: '', updatedAt: 'U4' },
  // An earlier year, so running balances have something to carry forward.
  { id: 'e5', year: '2025', month: '6', categoryId: 'c_inv', itemName: 'Gold saving',
    amount: '24323', isFixed: 'FALSE', note: '', updatedAt: 'U5' },
  // A row whose category no longer exists — renders under "Uncategorized".
  { id: 'e6', year: '2026', month: '9', categoryId: 'c_deleted', itemName: 'Orphan',
    amount: '100', isFixed: 'FALSE', note: '', updatedAt: 'U6' },
]

export const INCOME = [
  { id: 'i1', year: '2026', month: '9', source: 'Salary', amount: '65275', date: '2026-09-01' },
  { id: 'i2', year: '2025', month: '6', source: 'Salary', amount: '60000', date: '2025-06-01' },
]

export const SEL_MONTHS = [8]          // September, 0-indexed
export const YEAR = 2026
export const MONTH = 9

export const noop = () => {}

/** Every callback a component might invoke, so a missing one never masks a crash. */
export const handlers = new Proxy({}, { get: () => noop })
