export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const SOURCES = ['Salary', 'Freelance', 'Dividend', 'ITR Return', 'Other']
export const YEAR_NOW = new Date().getFullYear()
export const MONTH_NOW = new Date().getMonth() // 0-indexed
export const MONTH_NOW_1 = new Date().getMonth() + 1 // 1-indexed

export const fmt = (n) => '₹' + Math.round(+n || 0).toLocaleString('en-IN')

export const fmtK = (n) => {
  const v = Math.round(+n || 0)
  return v >= 100000
    ? '₹' + (v / 100000).toFixed(1) + 'L'
    : v >= 1000
    ? '₹' + (v / 1000).toFixed(1) + 'K'
    : '₹' + v
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