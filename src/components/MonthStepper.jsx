import { FormControl, Select, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { MONTHS } from '../utils/constants'
import { useGlobalStyles } from '../styles/globalStyles'

// ‹ [year] [month] › — shared by the Expenses and Income headers.
// Stepping across Dec/Jan only goes to a year that is in availableYears.
export function stepMonth(year, month, delta, availableYears) {
  let y = +year, m = +month + delta
  if (m < 1) { m = 12; y-- } else if (m > 12) { m = 1; y++ }
  return availableYears.some(a => +a === y) ? { year: y, month: m } : null
}

const optStyle = { background: 'var(--surface2)', color: 'var(--text)' }
const arrowSx = { color: 'var(--text2)', '&.Mui-disabled': { color: 'var(--line)' } }

export default function MonthStepper({ year, month, availableYears, onYearChange, onMonthChange }) {
  const { classes: g } = useGlobalStyles()
  const prev = stepMonth(year, month, -1, availableYears)
  const next = stepMonth(year, month, 1, availableYears)
  const go = (to) => { onYearChange(to.year); onMonthChange(to.month) }

  return (
    <>
      <IconButton size="small" aria-label="Previous month" disabled={!prev} onClick={() => go(prev)} sx={arrowSx}>
        <ChevronLeftIcon />
      </IconButton>
      <FormControl size="small" className={g.nativeSelectFormControl}>
        <Select value={year} onChange={e => onYearChange(+e.target.value)} native className={g.nativeSelect}>
          {availableYears.map(y => <option key={y} value={y} style={optStyle}>{y}</option>)}
        </Select>
      </FormControl>
      <FormControl size="small" className={g.nativeSelectFormControl}>
        <Select value={month} onChange={e => onMonthChange(+e.target.value)} native className={g.nativeSelect}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1} style={optStyle}>{m}</option>)}
        </Select>
      </FormControl>
      <IconButton size="small" aria-label="Next month" disabled={!next} onClick={() => go(next)} sx={arrowSx}>
        <ChevronRightIcon />
      </IconButton>
    </>
  )
}
