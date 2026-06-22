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
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { useAddExpenseModalStyles } from './styles/Expenses.styles'

import { MONTHS } from '../../utils/constants'

export default function AddExpenseModal({ initial, categories, year, month, availableYears = [new Date().getFullYear()], onSave, onClose }) {
  const { classes } = useAddExpenseModalStyles()
  const initialAmt = initial?.amount
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    categoryId: initial?.categoryId || categories[0]?.id || '',
    itemName: initial?.itemName || '',
    // The amount field always shows a positive number; direction (deposit vs
    // withdraw) is tracked separately and re-applied as a sign on save.
    amount: initialAmt ? String(Math.abs(+initialAmt)) : '',
    isFixed: initial?.isFixed === 'TRUE' || false,
    note: initial?.note || '',
  })

  const [saving, setSaving] = useState(false)
  // applyMode: 'single' | 'all_year' | 'this_and_forward'
  const [applyMode, setApplyMode] = useState('single')
  // txnDir: 'deposit' | 'withdraw' — only meaningful for savings/investment
  // categories. A withdrawal is stored as a negative amount so it reduces the
  // invested balance and returns the money to spendable cash.
  const [txnDir, setTxnDir] = useState(+initialAmt < 0 ? 'withdraw' : 'deposit')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isSavings = categories.find(c => c.id === form.categoryId)?.type === 'savings'
  const isWithdraw = isSavings && txnDir === 'withdraw'
  const valid = form.itemName.trim() && parseFloat(form.amount) > 0 && form.categoryId

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      const amt = Math.abs(parseFloat(form.amount) || 0)
      const payload = { ...form, amount: isWithdraw ? -amt : amt }
      await onSave(payload, applyMode)
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={true}
      onClose={saving ? undefined : onClose}
      className={classes.dialog}
    >
      <Box className={classes.content}>
        
        {/* Top Icon Badge */}
        <Box className={classes.iconBadge}>
          <ReceiptLongOutlinedIcon color="error" sx={{ fontSize: 28 }} />
        </Box>

        {/* Title */}
        <Typography variant="h6" className={classes.title}>
          {isWithdraw
            ? (form.id ? 'Edit Withdrawal' : 'Withdraw from Savings')
            : (form.id ? 'Edit Expense' : 'Add Expense')}
        </Typography>

        {/* Form Controls */}
        <Box className={classes.formContainer}>
          {/* Year & Month Grid */}
          <Box className={classes.rowGrid}>
            <FormControl size="small" className={classes.fieldStyles} style={{ flex: 1 }}>
              <InputLabel id="expense-year-label" shrink sx={{ color: 'text.secondary' }}>
                Year
              </InputLabel>
              <Select
                native
                labelId="expense-year-label"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                label="Year"
                notched
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </FormControl>

            <FormControl size="small" className={classes.fieldStyles} style={{ flex: 1 }}>
              <InputLabel id="expense-month-label" shrink sx={{ color: 'text.secondary' }}>
                Month
              </InputLabel>
              <Select
                native
                labelId="expense-month-label"
                value={form.month}
                onChange={e => set('month', +e.target.value)}
                label="Month"
                notched
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </Select>
            </FormControl>
          </Box>

          {/* Category Select */}
          <FormControl size="small" fullWidth className={classes.fieldStyles}>
            <InputLabel id="expense-category-label" shrink sx={{ color: 'text.secondary' }}>
              Category
            </InputLabel>
            <Select
              native
              labelId="expense-category-label"
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
              label="Category"
              notched
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormControl>

          {/* Deposit / Withdraw toggle — only for savings / investment categories */}
          {isSavings && (
            <Box style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="caption" className={classes.applyLabel}>
                Transaction type
              </Typography>
              <Box className={classes.applyButtonContainer}>
                {[
                  { value: 'deposit', label: '➕ Deposit' },
                  { value: 'withdraw', label: '➖ Withdraw' },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={txnDir === opt.value ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setTxnDir(opt.value)}
                    disabled={saving}
                    className={txnDir === opt.value ? classes.applyButtonActive : classes.applyButtonInactive}
                    sx={txnDir === opt.value && opt.value === 'withdraw' ? {
                      background: '#ff5f5f !important',
                      borderColor: '#ff5f5f !important',
                      '&:hover': { background: '#e64a4a !important' },
                    } : undefined}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
              <Typography sx={{ fontSize: 11, color: '#8891b8', mt: '6px' }}>
                {isWithdraw
                  ? 'Reduces this investment’s balance; the money returns to your spendable cash.'
                  : 'Adds money into this investment / savings pot.'}
              </Typography>
            </Box>
          )}

          {/* Item Name */}
          <TextField
            label="Item Name"
            value={form.itemName}
            onChange={e => set('itemName', e.target.value)}
            placeholder="e.g. Electricity Bill"
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            className={classes.fieldStyles}
          />

          {/* Amount */}
          <TextField
            label={isWithdraw ? 'Withdrawal Amount' : 'Amount'}
            type="number"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0"
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: 'text.secondary', fontWeight: 600, fontSize: 13 } }}>₹</InputAdornment>,
            }}
            className={classes.fieldStyles}
          />

          {/* Fixed / Recurring toggle — not shown for one-off withdrawals */}
          {!isWithdraw && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: '8px',
            background: form.isFixed ? 'rgba(91,127,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${form.isFixed ? 'rgba(91,127,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
            transition: 'all 0.2s'
          }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: form.isFixed ? '#a0b4ff' : '#8891b8' }}>
                📌 Fixed / Recurring
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#8891b8', mt: '2px' }}>
                Auto-copied to next month at start
              </Typography>
            </Box>
            <Switch
              checked={form.isFixed}
              onChange={e => set('isFixed', e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#5b7fff' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#5b7fff' }
              }}
            />
          </Box>
          )}

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
            {saving
              ? (form.id ? 'Updating...' : (isWithdraw ? 'Withdrawing...' : 'Adding...'))
              : isWithdraw
                ? (form.id ? 'Update Withdrawal' : 'Withdraw')
                : (form.id ? 'Update Expense' : 'Add Expense')}
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
