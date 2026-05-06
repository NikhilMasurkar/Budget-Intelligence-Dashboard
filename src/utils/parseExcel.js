// ============================================================
//  parseExcel.js — Reads balance_sheet_.xlsx from Google Drive
//
//  Actual sheet format (verified from Drive screenshot):
//    Sheet names : "BUDGET 2025", "BUDGET 2026"
//    Col A       : Item / Category label
//    Col B–M     : JAN–DEC (1-based cols 2–13)
//    Col N       : YEAR total (ignored)
//
//  Section logic:
//    - Rows before any category header → INCOME
//    - Rows after a matched category header → EXPENSE under that category
//    - "TOTALS" / "SUMMARY" → stop
// ============================================================

import ExcelJS from 'exceljs'

const MONTH_COL_START = 2   // Column B = JAN
const MONTH_COL_END   = 13  // Column M = DEC

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ─── CELL HELPERS ────────────────────────────────────────────
function getCellValue(cell) {
  if (cell.value === null || cell.value === undefined) return 0
  if (typeof cell.value === 'object') {
    if (cell.value.result !== undefined) return Number(cell.value.result) || 0
  }
  const n = Number(cell.value)
  return isNaN(n) ? 0 : n
}

function getCellText(cell) {
  if (cell.value === null || cell.value === undefined) return ''
  if (typeof cell.value === 'object') {
    if (cell.value.richText) return cell.value.richText.map(r => r.text).join('')
    if (cell.value.result !== undefined) return String(cell.value.result ?? '')
  }
  return String(cell.value).trim()
}

// ─── SKIP ROW DETECTOR ───────────────────────────────────────
const STOP_LABELS = new Set(['TOTALS', 'SUMMARY', 'TOTAL EXPENSES', 'CASH SHORT / EXTRA'])

function shouldStop(upper)  { return STOP_LABELS.has(upper) }
function shouldSkip(upper)  {
  return upper.startsWith('TOTAL ') ||
         upper.startsWith('MONTHLY BUDGET') ||
         upper.startsWith('PERSONAL MONTHLY BUDGET') ||
         upper === 'REVENUE' ||
         upper === 'NOTES / PENDING PAYMENTS' ||
         upper === 'TOTAL INCOME'
}

// ─── FUZZY CATEGORY MATCHER ──────────────────────────────────
// Falls back when category name in Excel doesn't exactly match app category
const FUZZY = [
  { keys: ['TRAVELLING','TRAVEL'],                              id: 'cat_travel'      },
  { keys: ['VACATION'],                                         id: 'cat_vacations'   },
  { keys: ['ENTERTAINMENT','ENTERTAINMENTS'],                   id: 'cat_entertain'   },
  { keys: ['FINANCIAL OBLIGATION','INVESTMENT','SAVING','SIP'], id: 'cat_invest'      },
  { keys: ['PERSONAL','LIFESTYLE'],                             id: 'cat_personal'    },
  { keys: ['RENTAL HOME','RENTAL'],                             id: 'cat_rental'      },
  { keys: ['OWNED HOME','HOME EMI','OWNED'],                    id: 'cat_home'        },
  { keys: ['ELECTRONIC','UTENSIL','GADGET'],                    id: 'cat_electronics' },
  { keys: ['HEALTH','MEDICAL','HOSPITAL'],                      id: 'cat_health'      },
  { keys: ['LOAN','EMI'],                                       id: 'cat_loans'       },
  { keys: ['RETURN MONEY','RETURN'],                            id: 'cat_return'      },
  { keys: ['RECHARGE','SUBSCRIPTION'],                          id: 'cat_recharge'    },
  { keys: ['SERVICES','PLANNING','BUILDING'],                   id: 'cat_services'    },
  { keys: ['MISCELLANEOUS','MISC'],                             id: 'cat_misc'        },
]

function resolveCategory(upper, categories, catByName) {
  // 1. Exact match
  if (catByName[upper]) return catByName[upper]

  // 2. Partial match against app category names
  for (const cat of categories) {
    const catUpper = cat.name.toUpperCase()
    if (upper.includes(catUpper) || catUpper.includes(upper)) return cat
  }

  // 3. Keyword fallback to default IDs
  for (const { keys, id } of FUZZY) {
    if (keys.some(k => upper.includes(k))) {
      return categories.find(c => c.id === id) || null
    }
  }
  return null
}

// ─── SHEET PARSER ────────────────────────────────────────────
function parseYearSheet(sheet, year, categories) {
  const expenses = []
  const income   = []

  const catByName = {}
  categories.forEach(c => { catByName[c.name.trim().toUpperCase()] = c })

  // State machine
  // section: 'INCOME' | 'EXPENSE' | null
  // We start with section = null and detect transitions:
  //   - "INCOME" label → switch to INCOME
  //   - Matching category label → switch to EXPENSE + set currentCat
  //   - "TOTALS"/"SUMMARY" → stop
  let section    = null
  let currentCat = null
  let stopped    = false

  sheet.eachRow(row => {
    if (stopped) return

    const rawA  = getCellText(row.getCell(1)).trim()
    if (!rawA) return

    const upper = rawA.toUpperCase()

    // ── STOP condition ─────────────────────────────────────────
    if (shouldStop(upper)) { stopped = true; return }

    // ── Skip structural / decorative rows ─────────────────────
    if (shouldSkip(upper)) return

    // ── INCOME section banner ──────────────────────────────────
    if (upper === 'INCOME') {
      section    = 'INCOME'
      currentCat = null
      return
    }

    // ── EXPENSES section banner (optional — some sheets have it) ─
    if (upper === 'EXPENSES') {
      section    = 'EXPENSE'
      currentCat = null
      return
    }

    // ── Read monthly values ────────────────────────────────────
    const amounts = []
    for (let c = MONTH_COL_START; c <= MONTH_COL_END; c++) {
      amounts.push(getCellValue(row.getCell(c)))
    }
    const hasValues = amounts.some(a => a !== 0)

    // ── Category header / blank row detection ─────────────────
    // Any row with NO month values is either:
    //   (a) A recognised category header → switch category
    //   (b) An unrecognised category header → RESET currentCat (critical!)
    //   (c) A blank decorative row → skip
    // Resetting currentCat on (b) prevents "Tickets" being wrongly
    // filed under the PREVIOUS category when "TRAVELLING" isn't matched.
    if (!hasValues) {
      const cat = resolveCategory(upper, categories, catByName)
      if (cat) {
        section    = 'EXPENSE'
        currentCat = cat
      } else if (section === 'EXPENSE') {
        // Unrecognised header in expense section — reset to avoid contamination
        currentCat = null
      }
      return
    }

    // ── Data row (has at least one non-zero month value) ───────
    if (section === 'INCOME') {
      amounts.forEach((amt, idx) => {
        if (amt === 0) return
        income.push({
          id: uid(), year: String(year), month: String(idx + 1),
          source: rawA, amount: String(Math.round(amt)),
        })
      })
    }

    if (section === 'EXPENSE' && currentCat) {
      amounts.forEach((amt, idx) => {
        if (amt === 0) return
        expenses.push({
          id: uid(), year: String(year), month: String(idx + 1),
          categoryId: currentCat.id, itemName: rawA,
          amount: String(Math.round(amt)), isFixed: 'FALSE',
        })
      })
    }
  })

  return { expenses, income }
}

// ─── MAIN ENTRY ──────────────────────────────────────────────
/**
 * Parse an ArrayBuffer of balance_sheet_.xlsx.
 * Handles sheet names: "BUDGET 2025", "BUDGET 2026", "PERSONALBUDGET2025" etc.
 */
export async function importFromExcel(buffer, categories) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const allExpenses = []
  const allIncome   = []
  const parsedYears = []

  workbook.eachSheet(sheet => {
    // Match "BUDGET 2025" or "PERSONALBUDGET2025"
    const m = sheet.name.match(/(?:PERSONAL)?BUDGET\s*(\d{4})/i)
    if (!m) {
      return
    }

    const year = m[1]
    parsedYears.push(year)

    const { expenses, income } = parseYearSheet(sheet, year, categories)
    allExpenses.push(...expenses)
    allIncome.push(...income)
  })

  return { expenses: allExpenses, income: allIncome, years: parsedYears }
}
