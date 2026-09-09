import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined'

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
    // Swap a trailing operator rather than stacking onto it.
    if (/[+\-*/]$/.test(cur)) return cur.slice(0, -1) + ch
    // Only one operation is supported — "+200" or "500+200". A second operator
    // would make the field unparseable, so refuse rather than allow a dead end.
    if (/[+\-*/]/.test(cur)) return null
    return cur + ch
  }

  // One decimal point per number, so "1.5+2.5" stays valid.
  if (ch === '.' && /\.\d*$/.test(cur)) return null
  return cur + ch
}

export default function AmountKeypad({ value, onChange, onDone, onEquals, resultLabel }) {
  const press = (ch) => {
    const next = nextAmountInput(value, ch)
    if (next !== null) onChange(next)
  }

  const Key = ({ label, onClick, variant = 'digit', wide, ariaLabel }) => (
    <Button
      onClick={onClick}
      disableRipple
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      sx={{
        gridColumn: wide ? 'span 2' : undefined,
        minWidth: 0, height: 44, borderRadius: '10px', fontSize: 17, fontWeight: 700,
        textTransform: 'none', lineHeight: 1,
        color: variant === 'op' ? '#a0b4ff' : variant === 'go' ? '#0b0e1a' : '#e4e8f5',
        background:
          variant === 'go' ? '#5b7fff'
            : variant === 'op' ? 'rgba(91,127,255,0.10)'
              : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.07)',
        '&:hover': {
          background:
            variant === 'go' ? '#4a6def'
              : variant === 'op' ? 'rgba(91,127,255,0.18)'
                : 'rgba(255,255,255,0.09)',
        },
      }}
    >
      {label}
    </Button>
  )

  return (
    <Box sx={{
      width: '100%', background: '#12172b',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
      p: '10px', mt: '-4px',
    }}>
      {resultLabel && (
        <Typography sx={{
          fontSize: 12, color: '#a0b4ff', textAlign: 'right',
          fontVariantNumeric: 'tabular-nums', px: '4px', pb: '8px',
        }}>
          {resultLabel}
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px' }}>
        {['1', '2', '3'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label="×" variant="op" onClick={() => press('*')} />

        {['4', '5', '6'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label="÷" variant="op" onClick={() => press('/')} />

        {['7', '8', '9'].map(d => <Key key={d} label={d} onClick={() => press(d)} />)}
        <Key label={<BackspaceOutlinedIcon sx={{ fontSize: 19 }} />} ariaLabel="Backspace"
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
