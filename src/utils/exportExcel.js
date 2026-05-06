import ExcelJS from 'exceljs'

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  // Blues – primary brand
  NAVY:        '1F3864', // deep navy – section banners
  STEEL:       '2E75B6', // mid-blue  – income header bar
  SKY:         'D6E4F7', // light sky – alternating income rows / year col accent

  // Reds / pinks – expense palette
  CRIMSON:     'C00000', // deep red  – expense banners
  BLUSH:       'FCE4D6', // pale blush – category header rows
  ROSE:        'F4CCCC', // rose      – total rows

  // Neutrals
  WHITE:       'FFFFFF',
  OFFWHITE:    'F9F9F9', // data rows background
  LIGHT_GRAY:  'E8E8E8', // subtle row separator
  MID_GRAY:    'BFBFBF', // thin borders
  DARK_GRAY:   '595959', // secondary labels

  // Text
  TEXT_BLACK:  '0D0D0D',
  TEXT_WHITE:  'FFFFFF',

  // Summary sheet
  SUMMARY_HDR: '243F60',
  SAVINGS_POS: 'D9F0D5', // light green for positive savings
  SAVINGS_NEG: 'FCE4D6', // blush for negative savings
}

const FONT = 'Verdana'
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fill(cell, hex) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } }
}

function toSentenceCase(str) {
  if (!str) return ''
  const t = String(str).trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function font(cell, { color = C.TEXT_BLACK, size = 11, bold = false, italic = false } = {}) {
  cell.font = { name: FONT, size, color: { argb: 'FF' + color }, bold, italic }
}

function align(cell, horizontal = 'left', vertical = 'middle') {
  cell.alignment = { horizontal, vertical, wrapText: false }
}

function border(cell, { bottom = 'thin', top = 'thin' } = {}) {
  const thin  = { style: 'thin',   color: { argb: 'FF' + C.MID_GRAY } }
  const thick = { style: 'medium', color: { argb: 'FF595959' } }
  cell.border = {
    top:    top    === 'medium' ? thick : thin,
    bottom: bottom === 'medium' ? thick : thin,
    left:   thin,
    right:  thin,
  }
}

function currencyFmt(cell) {
  cell.numFmt = '₹#,##0;(₹#,##0);"-"'
}

// Banner row: full-width colored row with a label
function banner(sheet, rowNum, label, bgHex, fgHex = C.TEXT_WHITE, fontSize = 12) {
  const row = sheet.getRow(rowNum)
  row.height = 26
  for (let c = 1; c <= 14; c++) {
    const cell = sheet.getCell(rowNum, c)
    fill(cell, bgHex)
    border(cell, { top: 'medium', bottom: 'medium' })
  }
  const cell = sheet.getCell(rowNum, 1)
  cell.value = label
  font(cell, { color: fgHex, size: fontSize, bold: true })
  align(cell, 'left')
}

// Month header sub-row (inside income / category sections)
function monthHeaderRow(sheet, rowNum, bgHex, labelColHex = C.TEXT_BLACK) {
  const row = sheet.getRow(rowNum)
  row.height = 20

  const labelCell = sheet.getCell(rowNum, 1)
  fill(labelCell, bgHex)
  border(labelCell)

  MONTHS.forEach((m, i) => {
    const cell = sheet.getCell(rowNum, i + 2)
    cell.value = m
    font(cell, { color: labelColHex, size: 10, bold: true })
    fill(cell, bgHex)
    align(cell, 'center')
    border(cell)
  })

  const yearCell = sheet.getCell(rowNum, 14)
  yearCell.value = 'YEAR'
  font(yearCell, { color: labelColHex, size: 10, bold: true })
  fill(yearCell, bgHex)
  align(yearCell, 'center')
  border(yearCell)
}

// A data row (income item or expense item)
function dataRow(sheet, rowNum, label, amounts, isAlt = false, notes = null) {
  const row = sheet.getRow(rowNum)
  row.height = 19
  const bg = isAlt ? C.OFFWHITE : C.WHITE

  const cellA = sheet.getCell(rowNum, 1)
  cellA.value = label
  font(cellA, { size: 11 })
  fill(cellA, bg)
  align(cellA, 'left')
  border(cellA)

  amounts.forEach((amt, i) => {
    const cell = sheet.getCell(rowNum, i + 2)
    cell.value = amt || 0
    font(cell, { size: 11 })
    fill(cell, bg)
    currencyFmt(cell)
    align(cell, 'right')
    border(cell)
    if (notes && notes[i]) {
      cell.note = notes[i]
    }
  })

  // YEAR column (row sum formula)
  const cellN = sheet.getCell(rowNum, 14)
  cellN.value = { formula: `SUM(B${rowNum}:M${rowNum})` }
  font(cellN, { size: 11, bold: true })
  fill(cellN, C.SKY)
  currencyFmt(cellN)
  align(cellN, 'right')
  border(cellN)
}

// Total row (category or income)
function totalRow(sheet, rowNum, label, startDataRow, bgHex = C.ROSE) {
  const row = sheet.getRow(rowNum)
  row.height = 21

  const cellA = sheet.getCell(rowNum, 1)
  cellA.value = label
  font(cellA, { size: 11, bold: true })
  fill(cellA, bgHex)
  align(cellA, 'left')
  border(cellA, { bottom: 'medium' })

  const hasData = startDataRow < rowNum
  for (let i = 0; i < 12; i++) {
    const cell = sheet.getCell(rowNum, i + 2)
    const col  = String.fromCharCode(66 + i)
    cell.value = hasData ? { formula: `SUM(${col}${startDataRow}:${col}${rowNum - 1})` } : 0
    font(cell, { size: 11, bold: true })
    fill(cell, bgHex)
    currencyFmt(cell)
    align(cell, 'right')
    border(cell, { bottom: 'medium' })
  }

  const cellN = sheet.getCell(rowNum, 14)
  cellN.value = hasData ? { formula: `SUM(N${startDataRow}:N${rowNum - 1})` } : 0
  font(cellN, { size: 11, bold: true })
  fill(cellN, bgHex)
  currencyFmt(cellN)
  align(cellN, 'right')
  border(cellN, { bottom: 'medium' })
}

// Empty spacer row
function spacer(sheet, rowNum, height = 8) {
  sheet.getRow(rowNum).height = height
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export async function exportToExcel(categories, expenses, income, filterYears = null) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Personal Budget'
  workbook.created = new Date()

  let years = Array.from(new Set([
    '2026', '2027',
    ...expenses.map(e => String(e.year)),
    ...income.map(i => String(i.year)),
  ])).sort()

  if (filterYears && filterYears.length > 0) {
    years = years.filter(y => filterYears.includes(String(y)))
  }
  
  if (years.length === 0) years = [String(new Date().getFullYear())]

  years.forEach(year => {
    const sheetName = `PERSONALBUDGET${year}`
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: false }], // cleaner look without grid lines
    })

    // ── Column widths ────────────────────────────────────────────────────────
    sheet.getColumn(1).width  = 32   // Item name
    for (let c = 2; c <= 13; c++) sheet.getColumn(c).width = 13  // Jan–Dec
    sheet.getColumn(14).width = 16   // Year total

    let r = 1

    // ── Title ────────────────────────────────────────────────────────────────
    spacer(sheet, r, 10); r++

    sheet.mergeCells(`A${r}:N${r}`)
    const titleCell = sheet.getCell(`A${r}`)
    titleCell.value = `PERSONAL MONTHLY BUDGET  ·  ${year}`
    font(titleCell, { color: C.TEXT_WHITE, size: 15, bold: true })
    fill(titleCell, C.NAVY)
    align(titleCell, 'center')
    sheet.getRow(r).height = 36
    r++

    spacer(sheet, r, 12); r++

    // ════════════════════════════════════════════════════════════════════════
    // INCOME SECTION
    // ════════════════════════════════════════════════════════════════════════
    banner(sheet, r, '  INCOME', C.STEEL, C.TEXT_WHITE, 12); r++
    monthHeaderRow(sheet, r, C.SKY, C.NAVY); r++

    // Build income data
    const incItems = income.filter(i => String(i.year) === year)
    const incBySource = {}
    incItems.forEach(i => {
      const source = toSentenceCase(i.source)
      if (!incBySource[source]) incBySource[source] = Array(12).fill(0)
      incBySource[source][i.month - 1] += Number(i.amount)
    })

    const incDataStart = r
    Object.entries(incBySource).forEach(([source, amounts], idx) => {
      dataRow(sheet, r, source, amounts, idx % 2 === 1)
      r++
    })

    // Income total
    const incTotalRow = r
    totalRow(sheet, r, 'TOTAL INCOME', incDataStart, C.SKY)
    // Override colors to steel blue after totalRow sets formulas
    ;[...Array(14)].forEach((_, ci) => {
      const cell = sheet.getCell(r, ci + 1)
      fill(cell, C.STEEL)
      font(cell, { color: C.TEXT_WHITE, size: 11, bold: true })
      if (ci === 0) align(cell, 'left')
      else { align(cell, 'right') }
      border(cell, { bottom: 'medium' })
    })
    r++

    // ════════════════════════════════════════════════════════════════════════
    // EXPENSES SECTION
    // ════════════════════════════════════════════════════════════════════════
    const expItems    = expenses.filter(e => String(e.year) === year)
    const activeCats  = categories.filter(c => c.type !== 'income')
    const catTotalRows = []

    activeCats.forEach(cat => {
      // Category items grouped by name
      const itemsForCat = expItems.filter(e => e.categoryId === cat.id)
      const itemsMap = {}
      itemsForCat.forEach(e => {
        const itemName = toSentenceCase(e.itemName)
        if (!itemsMap[itemName]) itemsMap[itemName] = { amounts: Array(12).fill(0), notes: Array(12).fill('') }
        itemsMap[itemName].amounts[e.month - 1] += Number(e.amount)
        if (e.note) {
          const prefix = itemsMap[itemName].notes[e.month - 1] ? '\n' : ''
          itemsMap[itemName].notes[e.month - 1] += `${prefix}• ${e.note} (₹${e.amount})`
        }
      })

      spacer(sheet, r, 6); r++

      // Category sub-header
      sheet.getRow(r).height = 22
      const catCell = sheet.getCell(r, 1)
      catCell.value = `  ${cat.name.toUpperCase()}`
      font(catCell, { color: C.NAVY, size: 11, bold: true })
      fill(catCell, C.BLUSH)
      align(catCell, 'left')
      border(catCell, { top: 'medium' })

      MONTHS.forEach((m, i) => {
        const cell = sheet.getCell(r, i + 2)
        cell.value = m
        font(cell, { color: C.NAVY, size: 10, bold: true })
        fill(cell, C.BLUSH)
        align(cell, 'center')
        border(cell, { top: 'medium' })
      })
      const yrCell = sheet.getCell(r, 14)
      yrCell.value = 'YEAR'
      font(yrCell, { color: C.NAVY, size: 10, bold: true })
      fill(yrCell, C.BLUSH)
      align(yrCell, 'center')
      border(yrCell, { top: 'medium' })
      r++

      const catDataStart = r
      Object.entries(itemsMap).forEach(([name, data], idx) => {
        dataRow(sheet, r, name, data.amounts, idx % 2 === 1, data.notes)
        r++
      })

      // Category total
      totalRow(sheet, r, `Total ${cat.name}`, catDataStart, C.ROSE)
      catTotalRows.push(r)
      r++
    })

    spacer(sheet, r, 10); r++

    // ════════════════════════════════════════════════════════════════════════
    // SUMMARY TOTALS
    // ════════════════════════════════════════════════════════════════════════
    banner(sheet, r, '  SUMMARY', C.NAVY, C.TEXT_WHITE, 12); r++

    // Total Expenses row
    sheet.getRow(r).height = 21
    const totExpA = sheet.getCell(r, 1)
    totExpA.value = 'Total Expenses'
    font(totExpA, { color: C.TEXT_BLACK, size: 11, bold: true })
    fill(totExpA, C.ROSE)
    align(totExpA, 'left')
    border(totExpA, { bottom: 'medium' })

    for (let i = 0; i < 12; i++) {
      const cell = sheet.getCell(r, i + 2)
      const col  = String.fromCharCode(66 + i)
      cell.value = catTotalRows.length
        ? { formula: catTotalRows.map(tr => `${col}${tr}`).join('+') }
        : 0
      font(cell, { size: 11, bold: true })
      fill(cell, C.ROSE)
      currencyFmt(cell)
      align(cell, 'right')
      border(cell, { bottom: 'medium' })
    }
    const totExpN = sheet.getCell(r, 14)
    totExpN.value = catTotalRows.length
      ? { formula: catTotalRows.map(tr => `N${tr}`).join('+') }
      : 0
    font(totExpN, { size: 11, bold: true })
    fill(totExpN, C.ROSE)
    currencyFmt(totExpN)
    align(totExpN, 'right')
    border(totExpN, { bottom: 'medium' })

    const totExpRow = r
    r++

    // Cash short / extra row
    sheet.getRow(r).height = 22
    const cashA = sheet.getCell(r, 1)
    cashA.value = 'Cash Short / Extra'
    font(cashA, { color: C.TEXT_WHITE, size: 11, bold: true })
    fill(cashA, C.NAVY)
    align(cashA, 'left')
    border(cashA, { bottom: 'medium' })

    for (let i = 0; i < 12; i++) {
      const cell = sheet.getCell(r, i + 2)
      const col  = String.fromCharCode(66 + i)
      cell.value = { formula: `${col}${incTotalRow}-${col}${totExpRow}` }
      font(cell, { color: C.TEXT_WHITE, size: 11, bold: true })
      fill(cell, C.NAVY)
      currencyFmt(cell)
      align(cell, 'right')
      border(cell, { bottom: 'medium' })
    }
    const cashN = sheet.getCell(r, 14)
    cashN.value = { formula: `N${incTotalRow}-N${totExpRow}` }
    font(cashN, { color: C.TEXT_WHITE, size: 11, bold: true })
    fill(cashN, C.NAVY)
    currencyFmt(cashN)
    align(cashN, 'right')
    border(cashN, { bottom: 'medium' })

    // Conditional formatting: red background for negative cash
    sheet.addConditionalFormatting({
      ref: `B${r}:N${r}`,
      rules: [{
        type: 'cellIs',
        operator: 'lessThan',
        formulae: ['0'],
        style: {
          fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC00000' } },
          font: { color: { argb: 'FFFFFFFF' }, bold: true },
        },
      }],
    })
    r++

    spacer(sheet, r, 10); r++

    // Notes row
    const noteCell = sheet.getCell(r, 1)
    noteCell.value = '📝  Notes / Pending payments'
    font(noteCell, { color: C.DARK_GRAY, size: 10, italic: true })
    fill(noteCell, C.LIGHT_GRAY)
    align(noteCell, 'left')
    sheet.getRow(r).height = 18
  })

  // ── SUMMARY SHEET ──────────────────────────────────────────────────────────
  const summary = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: false }],
  })

  summary.getColumn(1).width = 28
  summary.getColumn(2).width = 20
  summary.getColumn(3).width = 20
  summary.getColumn(4).width = 20

  // Title
  summary.mergeCells('A1:D1')
  const sTitleCell = summary.getCell('A1')
  sTitleCell.value = 'BUDGET OVERVIEW'
  font(sTitleCell, { color: C.TEXT_WHITE, size: 14, bold: true })
  fill(sTitleCell, C.SUMMARY_HDR)
  align(sTitleCell, 'center')
  summary.getRow(1).height = 32

  summary.getRow(2).height = 6

  // Header row
  const hdrRow = summary.getRow(3)
  hdrRow.height = 22
  ;['Period', 'Total Income', 'Total Expenses', 'Net Savings'].forEach((h, i) => {
    const cell = hdrRow.getCell(i + 1)
    cell.value = h
    font(cell, { color: C.TEXT_WHITE, size: 11, bold: true })
    fill(cell, C.SUMMARY_HDR)
    align(cell, i === 0 ? 'left' : 'right')
    border(cell, { bottom: 'medium' })
  })

  let sr = 4
  Array.from(years).sort().forEach((year, idx) => {
    const incTot = income.filter(i => String(i.year) === year)
      .reduce((s, i) => s + Number(i.amount), 0)
    const expTot = expenses.filter(e => String(e.year) === year)
      .reduce((s, e) => s + Number(e.amount), 0)
    const savings = incTot - expTot

    const row = summary.getRow(sr)
    row.height = 20
    const bg = idx % 2 === 0 ? C.WHITE : C.OFFWHITE

    const cells = [
      { v: `FY ${year}`,  fmt: null },
      { v: incTot,        fmt: '₹#,##0;(₹#,##0);"-"' },
      { v: expTot,        fmt: '₹#,##0;(₹#,##0);"-"' },
      { v: savings,       fmt: '₹#,##0;(₹#,##0);"-"' },
    ]
    cells.forEach(({ v, fmt }, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      font(cell, { size: 11, bold: i === 3 })
      fill(cell, i === 3 ? (savings >= 0 ? C.SAVINGS_POS : C.SAVINGS_NEG) : bg)
      align(cell, i === 0 ? 'left' : 'right')
      border(cell)
      if (fmt) cell.numFmt = fmt
    })
    sr++
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}