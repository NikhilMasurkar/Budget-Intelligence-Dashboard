import { useMemo } from 'react'
import { investmentCategoryIds } from '../utils/money'
import { SOURCES } from '../utils/constants'

// Lists the add/edit forms offer, worked out from the data already loaded.
export function useSuggestions({ expenses, income, categories }) {
  // What each investment pot holds, for the Withdraw-from dropdown.
  const investmentHoldings = useMemo(() => {
    const investIds = investmentCategoryIds(categories)
    const byName = new Map()
    expenses.forEach(e => {
      if (!investIds.has(e.categoryId)) return
      const name = e.itemName || 'Unnamed'
      byName.set(name, (byName.get(name) || 0) + (+e.amount || 0))
    })
    return [...byName.entries()]
      .map(([name, balance]) => ({ name, balance }))
      .filter(h => h.balance > 0)
      .sort((a, b) => b.balance - a.balance)
  }, [expenses, categories])

  // Past item names for the Add Expense suggestions, newest use first, each
  // remembering the category it was last filed under. Withdrawals (negative
  // rows) are skipped — their names come from the holdings dropdown.
  const itemSuggestions = useMemo(() => {
    const byName = new Map()
    // reverse() first so, within one month, the later sheet row wins (sort is stable).
    const newestFirst = [...expenses].reverse().sort((a, b) => (b.year - a.year) || (b.month - a.month))
    newestFirst.forEach(e => {
      const name = String(e.itemName || '').trim()
      const key = name.toLowerCase()
      if (!name || +e.amount < 0 || byName.has(key)) return
      byName.set(key, { name, categoryId: e.categoryId })
    })
    return [...byName.values()]
  }, [expenses])

  // Past custom income sources (not the built-in dropdown ones) for the Custom Source box.
  const sourceSuggestions = useMemo(() => {
    const builtIn = new Set(SOURCES.map(s => s.toLowerCase()))
    const byKey = new Map()
    income.forEach(i => {
      const name = String(i.source || '').trim()
      const key = name.toLowerCase()
      if (name && !builtIn.has(key) && !byKey.has(key)) byKey.set(key, name)
    })
    return [...byKey.values()]
  }, [income])

  return { investmentHoldings, itemSuggestions, sourceSuggestions }
}
