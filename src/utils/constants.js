// Human-readable app version (single-sourced from package.json via Vite define).
// The `typeof` guard keeps non-Vite contexts (e.g. node test scripts) from crashing.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

// Bump ONLY when the Excel/Sheet export FORMAT or its calculations change
// (exportExcel.js, parseExcel.js, summary math). On load, if the version stored
// in Firestore is lower, the app regenerates the Drive sheet once and records
// this number — so format changes roll out automatically without manual export.
// v1 = original (pre-versioning) format · v2 = investments excluded from Total
// Expenses + "Net Savings" + red/purple withdrawal styling · v3 = stable row ids
// embedded in cell-A notes (__biq:{month→id}__) for rename-safe reconciliation.
export const SHEET_FORMAT_VERSION = 3

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const SOURCES = ['Salary', 'Freelance', 'Dividend', 'ITR Return', 'Other']
export const YEAR_NOW = new Date().getFullYear()
export const MONTH_NOW = new Date().getMonth() // 0-indexed
export const MONTH_NOW_1 = new Date().getMonth() + 1 // 1-indexed

export const fmt = (n) => {
  const v = Math.round(+n || 0)
  return (v < 0 ? '-₹' : '₹') + Math.abs(v).toLocaleString('en-IN')
}

export const fmtK = (n) => {
  const v = Math.round(+n || 0)
  const sign = v < 0 ? '-' : ''
  const a = Math.abs(v)
  return a >= 100000
    ? sign + '₹' + (a / 100000).toFixed(1) + 'L'
    : a >= 1000
    ? sign + '₹' + (a / 1000).toFixed(1) + 'K'
    : sign + '₹' + a
}
export function defaultMonths(year) {
  return year >= YEAR_NOW
    ? [...Array(MONTH_NOW + 1).keys()]   // 0..MONTH_NOW
    : [...Array(12).keys()]              // 0..11
}

export const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8891b8', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8891b8', font: { size: 11 }, callback: v => fmtK(v) } }
  }
}

// ─── EXCEL EXPORT CONSTANTS ──────────────────────────────────────────────────
export const EXCEL_COLORS = {
  NAVY:        '1F3864', // deep navy – section banners
  STEEL:       '2E75B6', // mid-blue  – income header bar
  SKY:         'D6E4F7', // light sky – alternating income rows / year col accent
  CRIMSON:     'C00000', // deep red  – expense banners
  BLUSH:       'FCE4D6', // pale blush – category header rows
  ROSE:        'F4CCCC', // rose      – total rows
  WHITE:       'FFFFFF',
  OFFWHITE:    'F9F9F9', // data rows background
  LIGHT_GRAY:  'E8E8E8', // subtle row separator
  MID_GRAY:    'BFBFBF', // thin borders
  DARK_GRAY:   '595959', // secondary labels
  TEXT_BLACK:  '0D0D0D',
  TEXT_WHITE:  'FFFFFF',
  SUMMARY_HDR: '243F60',
  SAVINGS_POS: 'D9F0D5', // light green for positive savings
  SAVINGS_NEG: 'FCE4D6', // blush for negative savings
  INVEST_HDR:  'E6D9F5', // light purple – investment/savings section headers
  INVEST_TEXT: '5B2E91', // deep purple  – investment/savings section labels
  WITHDRAW_BG: 'F8D7DA', // soft red     – withdrawal (negative) cells
  WITHDRAW_TX: 'C00000', // deep red     – withdrawal (negative) text
}

export const EXCEL_FONT = 'Verdana'

// ─── PDF EXPORT CONSTANTS ────────────────────────────────────────────────────
export const PDF_USE_RUPEE_SYMBOL = false
export const PDF_FONT_NAME = PDF_USE_RUPEE_SYMBOL ? 'NotoSans' : 'helvetica'
export const PDF_CURRENCY = PDF_USE_RUPEE_SYMBOL ? '\u20B9' : 'Rs '

export const PDF_COLORS = {
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

export const PDF_TABLE_MARGIN = { left: 14, right: 14 }

// ─── MONTHS IN UPPERCASE (used in exports) ───────────────────────────────────
export const MONTHS_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
export const toSentenceCase = (str) => {
  if (!str) return ''
  const t = String(str).trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

// ─── EXCEL PARSER CONSTANTS ──────────────────────────────────────────────────
export const PARSE_MONTH_COL_START = 2
export const PARSE_MONTH_COL_END = 13
export const PARSE_STOP_LABELS = new Set(['TOTALS', 'SUMMARY', 'TOTAL EXPENSES', 'CASH SHORT / EXTRA'])
export const PARSE_FUZZY_CATEGORIES = [
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