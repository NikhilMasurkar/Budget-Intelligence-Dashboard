import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const USE_RUPEE_SYMBOL = false
const FONT_NAME = USE_RUPEE_SYMBOL ? 'NotoSans' : 'helvetica'
const CURRENCY = USE_RUPEE_SYMBOL ? '\u20B9' : 'Rs '

const toSentenceCase = (str) => {
  if (!str) return ''
  const t = String(str).trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

const fmtVal = (n) => {
  const v = Math.round(+n || 0)
  const abs = Math.abs(v).toLocaleString('en-IN')
  return v < 0 ? `-${CURRENCY}${abs}` : `${CURRENCY}${abs}`
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE  (tweak everything in one place)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy:         [31, 56, 100],   // brand / grand-total
  incomeHead:   [46, 117, 182],  // income header + income grand total
  incomeStripe: [240, 246, 252], // soft zebra for income rows
  expenseHead:  [192, 0, 0],     // expense header
  expenseSub:   [253, 235, 224], // category sub-header band
  expenseTotal: [248, 224, 224], // category subtotal band
  summaryInc:   [219, 233, 250], // summary "income" row
  summaryExp:   [250, 224, 224], // summary "expense" row

  // The "Year Total" column — one gold accent reused on every table so it always
  // reads as the totals column. Header gets a deeper gold cap.
  totalFill:    [255, 240, 199], // light gold (column body)
  totalText:    [122, 87, 0],    // dark amber text
  totalHead:    [224, 184, 88],  // deeper gold (header cell)
  totalHeadText:[51, 38, 0],

  white:        [255, 255, 255],
}

// Builds right-aligned column styles for the 12 month columns + year-total column.
// Doing alignment here (instead of only in didParseCell) makes it reliable, and
// gives the rightmost "Year Total" column its distinct gold shading.
const monthColumnStyles = () => {
  const styles = { 0: { fontStyle: 'bold', halign: 'left', cellWidth: 30 } }
  for (let c = 1; c <= 12; c++) styles[c] = { halign: 'right' }
  styles[13] = {
    halign: 'right',
    fontStyle: 'bold',
    fillColor: C.totalFill,
    textColor: C.totalText
  }
  return styles
}

// Paints the rightmost header cell ("Year Total") with the deeper gold cap so the
// whole total column reads as one unit, top to bottom. Call from didParseCell.
const styleTotalHeader = (data) => {
  if (data.section === 'head' && data.column.index === 13) {
    data.cell.styles.fillColor = C.totalHead
    data.cell.styles.textColor = C.totalHeadText
  }
}

const TABLE_MARGIN = { left: 14, right: 14 }

export async function exportToPdf(categories, expenses, income, filterYears = null) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // If embedding a Unicode font for ₹, register it once here.
  if (USE_RUPEE_SYMBOL) registerUnicodeFont(doc)
  doc.setFont(FONT_NAME, 'normal')

  let years = Array.from(new Set([
    '2026', '2027',
    ...expenses.map(e => String(e.year)),
    ...income.map(i => String(i.year)),
  ])).sort()

  if (filterYears && filterYears.length > 0) {
    years = years.filter(y => filterYears.includes(String(y)))
  }

  if (years.length === 0) years = [String(new Date().getFullYear())]

  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 1: COVER / OVERALL BUDGET OVERVIEW
  // ───────────────────────────────────────────────────────────────────────────
  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(20)
  doc.setTextColor(31, 56, 100) // Deep Navy
  doc.text('PERSONAL BUDGET INTELLIGENCE REPORT', 14, 25)

  doc.setFont(FONT_NAME, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(89, 89, 89)
  doc.text(
    `Generated on: ${new Date().toLocaleDateString('en-IN')}   |   Years included: ${years.length}`,
    14, 32
  )

  doc.setDrawColor(200, 200, 200)
  doc.line(14, 35, 283, 35)

  // Overall summary table
  const summaryHeaders = [['Period', 'Total Income', 'Total Expenses', 'Net Savings', 'Savings Rate']]
  const summaryBody = years.map(year => {
    const incTot = income.filter(i => String(i.year) === year)
      .reduce((s, i) => s + Number(i.amount), 0)
    const expTot = expenses.filter(e => String(e.year) === year)
      .reduce((s, e) => s + Number(e.amount), 0)
    const savings = incTot - expTot
    const rate = incTot > 0 ? ((savings / incTot) * 100).toFixed(1) + '%' : '0%'

    return [
      `FY ${year}`,
      fmtVal(incTot),
      fmtVal(expTot),
      fmtVal(savings),
      rate
    ]
  })

  autoTable(doc, {
    startY: 45,
    head: summaryHeaders,
    body: summaryBody,
    theme: 'grid',
    margin: TABLE_MARGIN,
    styles: { font: FONT_NAME, fontSize: 10, cellPadding: 3.5, valign: 'middle' },
    headStyles: { fillColor: [31, 56, 100], textColor: [255, 255, 255], halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 3) {
        // Highlight positive vs negative savings
        const valStr = String(data.cell.raw || '')
        if (valStr.startsWith('-')) {
          data.cell.styles.fillColor = [252, 228, 214] // blush
          data.cell.styles.textColor = [192, 0, 0]     // dark red
        } else {
          data.cell.styles.fillColor = [217, 240, 213] // light green
          data.cell.styles.textColor = [0, 128, 0]     // dark green
        }
      }
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DETAILED REPORTS BY YEAR
  // ───────────────────────────────────────────────────────────────────────────
  years.forEach(year => {
    doc.addPage()

    // Title
    doc.setFont(FONT_NAME, 'bold')
    doc.setFontSize(16)
    doc.setTextColor(31, 56, 100)
    doc.text(`BUDGET DETAIL - FY ${year}`, 14, 18)

    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(89, 89, 89)
    doc.text('All values in Indian Rupees (INR)', 14, 23)

    // Data lists for this year
    const incItems = income.filter(i => String(i.year) === year)
    const expItems = expenses.filter(e => String(e.year) === year)
    const activeCats = categories.filter(c => c.type !== 'income')

    // Monthly aggregation
    const monthlyIncome = Array(12).fill(0)
    const monthlyExpenses = Array(12).fill(0)

    incItems.forEach(i => {
      const m = i.month - 1
      if (m >= 0 && m < 12) monthlyIncome[m] += Number(i.amount) || 0
    })
    expItems.forEach(e => {
      const m = e.month - 1
      if (m >= 0 && m < 12) monthlyExpenses[m] += Number(e.amount) || 0
    })

    // ─── 1. INCOME TABLE ─────────────────────────────────────────────────────
    const incHeaders = [['Income Source', ...MONTHS, 'Year Total']]
    const incBySource = {}
    incItems.forEach(i => {
      const source = toSentenceCase(i.source)
      if (!incBySource[source]) incBySource[source] = Array(12).fill(0)
      incBySource[source][i.month - 1] += Number(i.amount)
    })

    const incBody = []
    Object.entries(incBySource).forEach(([source, amounts]) => {
      const sum = amounts.reduce((s, v) => s + v, 0)
      incBody.push([source, ...amounts.map(fmtVal), fmtVal(sum)])
    })

    const incTotalSum = monthlyIncome.reduce((s, v) => s + v, 0)
    incBody.push(['TOTAL INCOME', ...monthlyIncome.map(fmtVal), fmtVal(incTotalSum)])

    autoTable(doc, {
      startY: 28,
      head: incHeaders,
      body: incBody,
      theme: 'grid',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1.6, valign: 'middle', overflow: 'visible' },
      headStyles: { fillColor: C.incomeHead, textColor: C.white, halign: 'center' },
      alternateRowStyles: { fillColor: C.incomeStripe },
      columnStyles: monthColumnStyles(),
      didParseCell: function (data) {
        styleTotalHeader(data)
        // Grand-total row ("TOTAL INCOME") — solid income color, full width
        if (data.section === 'body' && data.row.index === incBody.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = C.incomeHead
          data.cell.styles.textColor = C.white
        }
      }
    })

    // ─── 2. EXPENSES TABLE ───────────────────────────────────────────────────
    const expHeaders = [['Expense Category / Item', ...MONTHS, 'Year Total']]
    const expBody = []
    const subHeaderRowsIndices = []
    const catTotalRowsIndices = []

    activeCats.forEach(cat => {
      const itemsForCat = expItems.filter(e => e.categoryId === cat.id)
      if (itemsForCat.length === 0) return

      // Add Category sub-header row
      subHeaderRowsIndices.push(expBody.length)
      expBody.push([cat.name.toUpperCase(), ...Array(13).fill('')])

      const itemsMap = {}
      itemsForCat.forEach(e => {
        const itemName = toSentenceCase(e.itemName)
        if (!itemsMap[itemName]) itemsMap[itemName] = Array(12).fill(0)
        itemsMap[itemName][e.month - 1] += Number(e.amount)
      })

      const catMonthlySums = Array(12).fill(0)
      Object.entries(itemsMap).forEach(([name, amounts]) => {
        const sum = amounts.reduce((s, v) => s + v, 0)
        amounts.forEach((v, i) => { catMonthlySums[i] += v })
        expBody.push([name, ...amounts.map(fmtVal), fmtVal(sum)])
      })

      // Add Category subtotal row
      catTotalRowsIndices.push(expBody.length)
      const catTotalSum = catMonthlySums.reduce((s, v) => s + v, 0)
      expBody.push([`Total ${cat.name}`, ...catMonthlySums.map(fmtVal), fmtVal(catTotalSum)])
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: expHeaders,
      body: expBody,
      theme: 'grid',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: { font: FONT_NAME, fontSize: 7, cellPadding: 1.6, valign: 'middle', overflow: 'visible' },
      headStyles: { fillColor: C.expenseHead, textColor: C.white, halign: 'center' },
      columnStyles: monthColumnStyles(),
      didParseCell: function (data) {
        styleTotalHeader(data)
        if (data.section !== 'body') return

        if (subHeaderRowsIndices.includes(data.row.index)) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = C.expenseSub
          data.cell.styles.textColor = C.navy
        } else if (catTotalRowsIndices.includes(data.row.index)) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = C.expenseTotal
          data.cell.styles.textColor = [0, 0, 0]
        }
      }
    })

    // ─── 3. SUMMARY TABLE ────────────────────────────────────────────────────
    const summaryTableHeaders = [['Summary', ...MONTHS, 'Year Total']]
    const totalExpSum = monthlyExpenses.reduce((s, v) => s + v, 0)
    const netCashFlow = monthlyIncome.map((v, i) => v - monthlyExpenses[i])
    const netCashSum = incTotalSum - totalExpSum

    const summaryTableBody = [
      ['Total Income', ...monthlyIncome.map(fmtVal), fmtVal(incTotalSum)],
      ['Total Expenses', ...monthlyExpenses.map(fmtVal), fmtVal(totalExpSum)],
      ['Cash Short / Extra', ...netCashFlow.map(fmtVal), fmtVal(netCashSum)]
    ]

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: summaryTableHeaders,
      body: summaryTableBody,
      theme: 'grid',
      margin: TABLE_MARGIN,
      tableWidth: 'auto',
      styles: { font: FONT_NAME, fontSize: 7.5, cellPadding: 1.8, valign: 'middle', overflow: 'visible' },
      headStyles: { fillColor: [31, 56, 100], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 30 },
        ...(() => { const s = {}; for (let c = 1; c <= 12; c++) s[c] = { halign: 'right' }; return s })(),
        13: { halign: 'right', fontStyle: 'bold', fillColor: C.totalFill, textColor: C.totalText }
      },
      didParseCell: function (data) {
        styleTotalHeader(data)
        if (data.section !== 'body') return

        if (data.row.index === 0) {
          if (data.column.index !== 13) data.cell.styles.fillColor = C.summaryInc // income row
        } else if (data.row.index === 1) {
          if (data.column.index !== 13) data.cell.styles.fillColor = C.summaryExp // expense row
        } else if (data.row.index === 2) {
          // Net cash flow — the headline number. Solid navy, full width.
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = C.navy
          data.cell.styles.textColor = C.white

          // Negative months/totals flip to crimson so shortfalls jump out
          if (data.column.index > 0) {
            const valStr = String(data.cell.raw || '')
            if (valStr.startsWith('-')) {
              data.cell.styles.fillColor = C.expenseHead
              data.cell.styles.textColor = C.white
            }
          }
        }
      }
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // FOOTER: page numbers on every page
  // ───────────────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFont(FONT_NAME, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${p} of ${pageCount}`, 283, 203, { align: 'right' })
  }

  doc.save('budget_report.pdf')
}
