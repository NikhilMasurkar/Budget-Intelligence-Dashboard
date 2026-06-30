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
import {
  PARSE_MONTH_COL_START as MONTH_COL_START,
  PARSE_MONTH_COL_END as MONTH_COL_END,
  PARSE_STOP_LABELS as STOP_LABELS,
  PARSE_FUZZY_CATEGORIES as FUZZY
} from './constants'

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

// Read a cell's comment/note (ExcelJS may store it as a string or { texts: [...] }).
function getCellNote(cell) {
  const n = cell.note
  if (!n) return ''
  if (typeof n === 'string') return n
  if (Array.isArray(n.texts)) return n.texts.map(t => t.text || '').join('')
  if (typeof n.text === 'string') return n.text
  return ''
}

// Extract the month→id map embedded by exportExcel in column-A cell notes.
// Format: __biq:{"1":"abc","3":"def"}__ (month as string key → DB row id).
// Returns {} for old/hand-crafted files that don't have it.
function extractMonthIds(cell) {
  const note = getCellNote(cell)
  if (!note) return {}
  const start = note.indexOf('__biq:')
  if (start === -1) return {}
  const jsonStart = start + 6
  const end = note.indexOf('__', jsonStart)
  if (end === -1) return {}
  try { return JSON.parse(note.slice(jsonStart, end)) } catch { return {} }
}

// exportExcel.js writes notes as `• <note> (₹<amount>)`, one per line if several.
// Strip that decoration so re-importing recovers the original note text without
// compounding the bullet/amount on the next export. Plain hand-written comments
// (no decoration) pass through unchanged.
function cleanNote(raw) {
  if (!raw) return ''
  return String(raw)
    .split('\n')
    .map(line => line.replace(/^\s*•\s*/, '').replace(/\s*\(₹[\d,]+\)\s*$/, '').trim())
    .filter(Boolean)
    .join(' / ')
}

// ─── SKIP ROW DETECTOR ───────────────────────────────────────
// STOP_LABELS is imported from constants.js

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
// FUZZY is imported from constants.js

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

    // ── Read monthly values (and any cell-comment notes) ───────
    const amounts = []
    const notes = []
    for (let c = MONTH_COL_START; c <= MONTH_COL_END; c++) {
      const cell = row.getCell(c)
      amounts.push(getCellValue(cell))
      notes.push(cleanNote(getCellNote(cell)))
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
      const monthIds = extractMonthIds(row.getCell(1))
      amounts.forEach((amt, idx) => {
        if (amt === 0) return
        const m = String(idx + 1)
        income.push({
          id: monthIds[m] || uid(), year: String(year), month: m,
          source: rawA, amount: String(Math.round(amt)),
        })
      })
    }

    if (section === 'EXPENSE' && currentCat) {
      const monthIds = extractMonthIds(row.getCell(1))
      amounts.forEach((amt, idx) => {
        if (amt === 0) return
        const m = String(idx + 1)
        expenses.push({
          id: monthIds[m] || uid(), year: String(year), month: m,
          categoryId: currentCat.id, itemName: rawA,
          amount: String(Math.round(amt)), isFixed: 'FALSE',
          note: notes[idx] || '',
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
