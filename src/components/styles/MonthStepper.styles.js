import { makeStyles } from 'tss-react/mui'

// Styles for MonthStepper.jsx.
export const useMonthStepperUi = makeStyles()(() => ({
  arrow: {
    color: 'var(--text2)',
    '&.Mui-disabled': { color: 'var(--line)' },
  },
  option: {
    background: 'var(--surface2)',
    color: 'var(--text)',
  },
}))
