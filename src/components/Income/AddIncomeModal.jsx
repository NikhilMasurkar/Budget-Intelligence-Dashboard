import React, { useState } from 'react'
import {
  Dialog,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  InputAdornment
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useAddIncomeModalStyles } from './styles/Income.styles'

import { MONTHS, SOURCES, fmt } from '../../utils/constants'
import { applyAmountExpression } from '../../utils/money'
import AmountKeypad from '../Expenses/AmountKeypad'

export default function AddIncomeModal({ initial, year, month, availableYears = [new Date().getFullYear()], onSave, onClose }) {
  const { classes } = useAddIncomeModalStyles()
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    source: initial?.source || 'Salary',
    amount: initial?.amount || '',
    date: initial?.date || new Date().toISOString().slice(0, 10),
  })

  // The amount this row had when the modal opened. "+200" adjusts against it,
  // so editing a ₹65,000 salary to ₹65,200 does not mean doing the sum yourself.
  const baseAmount = Math.abs(+(initial?.amount) || 0)
  const [padOpen, setPadOpen] = useState(false)

  // applyMode: 'single' | 'all_year' | 'this_and_forward'
  const [applyMode, setApplyMode] = useState('single')
  const [customSrc, setCustomSrc] = useState(
    initial?.source && !SOURCES.includes(initial.source) ? initial.source : ''
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSourceChange = (e) => {
    const val = e.target.value
    if (val === 'Other') {
      set('source', customSrc || '')
    } else {
      set('source', val)
      setCustomSrc('')
    }
  }

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      await onSave({ ...form, amount: amt }, applyMode)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const isOther = !SOURCES.slice(0, -1).includes(form.source)
  const expr     = applyAmountExpression(baseAmount, form.amount)
  const amt      = expr ? Math.abs(expr.value) : 0
  const adjusted = !!expr && expr.op !== null
  const valid = amt > 0 && form.source.toString().trim() !== ''

  return (
    <Dialog
      open={true}
      onClose={saving ? undefined : onClose}
      className={classes.dialog}
    >
      <Box className={classes.content}>
        
        <Box className={classes.iconBadge}>
          <TrendingUpIcon sx={{ fontSize: 28, color: '#52B788' }} />
        </Box>

        <Typography variant="h6" className={classes.title}>
          {form.id ? 'Edit Income' : 'Add Income'}
        </Typography>

        <Box className={classes.formContainer}>
          <Box className={classes.rowGrid}>
            <FormControl size="small" className={classes.fieldStyles} style={{ flex: 1 }}>
              <InputLabel id="income-year-label" shrink sx={{ color: 'text.secondary' }}>
                Year
              </InputLabel>
              <Select
                native
                labelId="income-year-label"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                label="Year"
                notched
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </FormControl>

            <FormControl size="small" className={classes.fieldStyles} style={{ flex: 1 }}>
              <InputLabel id="income-month-label" shrink sx={{ color: 'text.secondary' }}>
                Month
              </InputLabel>
              <Select
                native
                labelId="income-month-label"
                value={form.month}
                onChange={e => set('month', +e.target.value)}
                label="Month"
                notched
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small" fullWidth className={classes.fieldStyles}>
            <InputLabel id="income-source-label" shrink sx={{ color: 'text.secondary' }}>
              Source
            </InputLabel>
            <Select
              native
              labelId="income-source-label"
              value={SOURCES.includes(form.source) ? form.source : 'Other'}
              onChange={handleSourceChange}
              label="Source"
              notched
            >
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormControl>

          {isOther && (
            <TextField
              label="Custom Source"
              value={form.source}
              onChange={e => {
                set('source', e.target.value)
                setCustomSrc(e.target.value)
              }}
              placeholder="Enter your source"
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              autoFocus
              className={classes.fieldStyles}
            />
          )}

          <TextField
            label="Amount"
            // Text, not number: type="number" rejects "+200" outright.
            // inputMode="none" keeps the system keyboard down so the pad below
            // drives this field; focus, caret and physical typing still work.
            type="text"
            inputMode="none"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            onFocus={() => setPadOpen(true)}
            onClick={() => setPadOpen(true)}
            placeholder={baseAmount ? 'e.g. +200, -50, *2 or a new amount' : '0'}
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: 'text.secondary', fontWeight: 600, fontSize: 13 } }}>
                  ₹
                </InputAdornment>
              ),
            }}
            className={classes.fieldStyles}
          />

          {adjusted && (
            <Box sx={{
              width: '100%', mt: '-4px',
              background: 'rgba(82,183,136,0.10)', border: '1px solid rgba(82,183,136,0.35)',
              borderRadius: '8px', p: '8px 12px',
            }}>
              <Typography sx={{ fontSize: 12, color: '#7fd6a8', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(baseAmount)} {expr.op === '-' ? '−' : expr.op} {expr.operand} = <b>{fmt(amt)}</b>
              </Typography>
            </Box>
          )}
          {form.amount.toString().trim() && !expr && (
            <Typography sx={{ width: '100%', mt: '-4px', fontSize: 11.5, color: '#ff7a7a' }}>
              Can't read that — type a number, or +200 / -50 / *2 to adjust the current amount.
            </Typography>
          )}

          {padOpen && (
            <AmountKeypad
              value={form.amount}
              onChange={(v) => set('amount', v)}
              onDone={() => setPadOpen(false)}
              resultLabel={expr ? `= ${fmt(amt)}` : null}
              onEquals={() => { if (expr) set('amount', String(expr.value)) }}
            />
          )}

          {/* Date Received */}
          <TextField
            label="Date Received"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            className={classes.fieldStyles}
          />

          <Box style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="caption" className={classes.applyLabel}>
              Apply to
            </Typography>
            <Box className={classes.applyButtonContainer}>
              {[
                { value: 'single', label: 'This month only' },
                { value: 'all_year', label: 'Whole year' },
                { value: 'this_and_forward', label: `${MONTHS[(form.month || 1) - 1]} → Dec` },
              ].map(opt => (
                <Button
                  key={opt.value}
                  variant={applyMode === opt.value ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setApplyMode(opt.value)}
                  disabled={saving}
                  className={applyMode === opt.value ? classes.applyButtonActive : classes.applyButtonInactive}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        <Box className={classes.actionsContainer}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !valid}
            className={classes.saveButton}
          >
            {saving ? (form.id ? 'Updating...' : 'Adding...') : (form.id ? 'Update Income' : 'Add Income')}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={saving}
            className={classes.cancelButton}
          >
            Cancel
          </Button>
        </Box>

      </Box>
    </Dialog>
  )
}
