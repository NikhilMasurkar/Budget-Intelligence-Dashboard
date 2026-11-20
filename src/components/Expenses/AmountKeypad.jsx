import { Box, Button, Typography } from '@mui/material'
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined'
import { useAmountKeypadUi } from './styles/AmountKeypad.styles'

const OPERATORS = { '/': '÷', '*': '×', '-': '−', '+': '+' }

/**
 * Next field value after a key press, or null when the press should be ignored.
 *
 * Exported so the rules can be tested directly — this is where a pad can strand
 * the user on input the parser cannot read.
 */
export function nextAmountInput(value, ch) {
  const cur = String(value || '')

  if (ch in OPERATORS) {
    // Swap a trailing operator rather than stacking onto it. Any number of
    // steps can follow, so "+200+150+80" adds three bills in one go.
    if (/[+\-*/]$/.test(cur)) return cur.slice(0, -1) + ch
    return cur + ch
  }

  // One decimal point per number, so "1.5+2.5" stays valid.
  if (ch === '.' && /\.\d*$/.test(cur)) return null
  return cur + ch
}

export default function AmountKeypad({ value, onChange, onDone, onEquals, resultLabel }) {
  const { classes: ui, cx } = useAmountKeypadUi()
  const press = (ch) => {
    const next = nextAmountInput(value, ch)
    if (next !== null) onChange(next)
  }

  const Key = ({ label, onClick, variant = 'digit', wide, ariaLabel }) => (
    <Button
      onClick={onClick}
      disableRipple
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      className={cx(ui.key, wide && ui.keyWide, variant === 'op' && ui.keyOp, variant === 'go' && ui.keyGo)}
    >
      {label}
    </Button>
  )

  return (
    <Box className={ui.resultBar}>
      {resultLabel && (
        <Typography className={ui.resultText}>
          {resultLabel}
        </Typography>
      )}

      <Box className={ui.keys}>
        {['1', '2', '3'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label="×" variant="op" onClick={() => press('*')} />

        {['4', '5', '6'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label="÷" variant="op" onClick={() => press('/')} />

        {['7', '8', '9'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label={<BackspaceOutlinedIcon className={ui.backspaceIcon} />} ariaLabel="Backspace"
          onClick={() => onChange(String(value || '').slice(0, -1))} />

        <Key label="." onClick={() => press('.')} />
        <Key label="0" onClick={() => press('0')} />
        <Key label="C" ariaLabel="Clear" onClick={() => onChange('')} />
        <Key label="−" variant="op" onClick={() => press('-')} />

        <Key label="=" variant="op" wide onClick={onEquals} />
        <Key label="+" variant="op" onClick={() => press('+')} />
        <Key label="Done" variant="go" onClick={onDone} />
      </Box>
    </Box>
  )
}
