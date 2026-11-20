// Reads a BudgetIQ backup (.json from the Download dialog or the weekly email)
// and checks it before anything is overwritten. Throws a message fit to show.
export function parseBackup(text) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('This file is not a BudgetIQ backup (not valid JSON).') }
  if (!data || typeof data !== 'object' || !Array.isArray(data.expenses) || !Array.isArray(data.income)) {
    throw new Error('This file is not a BudgetIQ backup (no expenses / income lists).')
  }
  const categories = Array.isArray(data.categories) ? data.categories : []
  const dated = (x) => x && x.id && +x.year > 0 && +x.month >= 1 && +x.month <= 12
  const badExp = data.expenses.filter(x => !dated(x)).length
  const badInc = data.income.filter(x => !dated(x)).length
  if (badExp || badInc) throw new Error(`The backup has ${badExp + badInc} entries without an id, year or month — it may be damaged.`)
  if (categories.some(c => !c?.id)) throw new Error('The backup has a category without an id — it may be damaged.')
  if (!data.expenses.length && !data.income.length) throw new Error('The backup is empty, so restoring it would erase everything.')
  const asItem = (x) => ({ ...x, id: String(x.id), year: String(+x.year), month: String(+x.month) })
  return {
    exportedAt: data.exportedAt || null,
    categories,
    expenses: data.expenses.map(asItem),
    income: data.income.map(asItem),
  }
}
