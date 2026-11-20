import { tokens, rgba } from '../theme/tokens'
// Human-readable app version (single-sourced from package.json via Vite define).
// The `typeof` guard keeps non-Vite contexts (e.g. node test scripts) from crashing.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

// Whether to surface AI features in the UI. Defaults on; set VITE_AI_ENABLED=false
// to hide them (e.g. plain `vite` dev without the function running).
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED !== 'false'

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
// Reads the clock at call time, not at module load. YEAR_NOW/MONTH_NOW are
// frozen when the bundle first evaluates, so a PWA left open across a month or
// year boundary would keep offering the old range — and this app is explicitly
// meant to stay installed (there's a nightly reminder to reopen it).
export function defaultMonths(year) {
  const now = new Date()
  return Number(year) >= now.getFullYear()
    ? [...Array(now.getMonth() + 1).keys()]   // Jan..this month
    : [...Array(12).keys()]                   // whole year
}

// Last year stays editable through January, so late December bills and card
// statements can still be filed under December. From 1 Feb it is read-only.
export function isYearLocked(year, now = new Date()) {
  const y = parseInt(year), cur = now.getFullYear()
  return y < cur - 1 || (y === cur - 1 && now.getMonth() > 0)
}
// True while last year is in its January grace period.
export function inLockGrace(year, now = new Date()) {
  return parseInt(year) === now.getFullYear() - 1 && now.getMonth() === 0
}

export const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    // Getters: read the active theme's colours each time the chart draws.
    x: { grid: { get color() { return rgba(tokens.ink, 0.06) } }, ticks: { get color() { return tokens.text2 }, font: { size: 11 } } },
    y: { grid: { get color() { return rgba(tokens.ink, 0.06) } }, ticks: { get color() { return tokens.text2 }, font: { size: 11 }, callback: v => fmtK(v) } }
  }
}

// ─── PDF EXPORT CONSTANTS ────────────────────────────────────────────────────
// jsPDF's built-in fonts have no ₹ glyph, so amounts print as "Rs".
export const PDF_FONT_NAME = 'helvetica'
export const PDF_CURRENCY = 'Rs '

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

// Move a YYYY-MM-DD date onto a different month of the same year, keeping the
// day where possible and clamping to the month's length (31 Jan → 28 Feb).
//
// Applying one income entry across months used to copy its date verbatim, so a
// salary added in September and applied to the whole year showed "9 Sep" on the
// January row. Returns '' for a missing or unparseable date.
export function dateForMonth(isoDate, month) {
  if (!isoDate) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim())
  if (!m) return ''
  const [, y, , d] = m
  const mm = Math.min(12, Math.max(1, parseInt(month, 10) || 1))
  const lastDay = new Date(Number(y), mm, 0).getDate()
  const day = Math.min(parseInt(d, 10), lastDay)
  return `${y}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
