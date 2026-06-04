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

import { MONTHS, SOURCES } from '../../utils/constants'

export default function AddIncomeModal({ initial, year, month, onSave, onClose }) {
  const { classes } = useAddIncomeModalStyles()
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    source: initial?.source || 'Salary',
    amount: initial?.amount || '',
  })

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
      await onSave(form, applyMode)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  const isOther = !SOURCES.slice(0, -1).includes(form.source)
  const valid = form.amount && form.source.toString().trim() !== ''

  return (
    <Dialog
      open={true}
      onClose={saving ? undefined : onClose}
      className={classes.dialog}
    >
      <Box className={classes.content}>
        
        {/* Top Icon Badge */}
        <Box className={classes.iconBadge}>
          <TrendingUpIcon sx={{ fontSize: 28, color: '#52B788' }} />
        </Box>

        {/* Title */}
        <Typography variant="h6" className={classes.title}>
          {form.id ? 'Edit Income' : 'Add Income'}
        </Typography>

        {/* Form Controls */}
        <Box className={classes.formContainer}>
          {/* Year & Month Grid */}
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
                {[2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
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

          {/* Source Select */}
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

          {/* Custom Source Input */}
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

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0"
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

          {/* Apply Mode Selector */}
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

        {/* Actions */}
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
