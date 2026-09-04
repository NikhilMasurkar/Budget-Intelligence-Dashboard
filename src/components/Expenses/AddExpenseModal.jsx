import React, { useState, useMemo } from 'react'
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
import { isInvestmentCategory, splitWithdrawal } from '../../utils/money'

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

const WITHDRAW_ALL = '__all__'

export default function AddExpenseModal({ initial, categories, year, month, availableYears = [new Date().getFullYear()], holdings = [], onSave, onClose }) {
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

  const [withdrawFrom, setWithdrawFrom] = useState(initial?.itemName || '')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isSavings = isInvestmentCategory(categories.find(c => c.id === form.categoryId))
  const isWithdraw = isSavings && txnDir === 'withdraw'
  const available = useMemo(() => {
    const list = holdings.filter(h => h.balance > 0)
    const current = initial?.itemName
    if (current && current !== WITHDRAW_ALL && !list.some(h => h.name === current)) {
      return [...list, { name: current, balance: 0 }]
    }
    return list
  }, [holdings, initial])
  const splitAll = isWithdraw && withdrawFrom === WITHDRAW_ALL
  const amt = parseFloat(form.amount) || 0
  const parts = splitAll ? splitWithdrawal(Math.round(amt), available) : []

  // Guard: a pot cannot hold a negative amount, so taking out more than it holds
  // is always either a typo or missing history. Not blocked outright — someone's
  // records can genuinely be incomplete — but it states the shortfall and makes
  // the button say so, which an accidental entry cannot slip past.
  const availableFrom = splitAll
    ? available.reduce((s, h) => s + h.balance, 0)
    : (available.find(h => h.name === withdrawFrom)?.balance ?? 0)
  const overdrawn = isWithdraw && !!withdrawFrom && amt > availableFrom
  const shortfall = overdrawn ? amt - availableFrom : 0

  const valid = form.categoryId && parseFloat(form.amount) > 0 && (
    isWithdraw ? (splitAll ? parts.length > 0 : !!withdrawFrom) : form.itemName.trim()
  )

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      const amt = Math.abs(parseFloat(form.amount) || 0)
      // A withdrawal can't be "fixed/recurring" (the toggle is hidden for it),
      // so never persist a stale isFixed=true left over from before the switch.
      if (splitAll) {
        // One row per pot so each balance drops by its own share.
        await onSave(
          parts.map(p => ({ ...form, itemName: p.name, amount: -p.amount, isFixed: false })),
          'split'
        )
      } else {
        const payload = {
          ...form,
          itemName: isWithdraw ? withdrawFrom : form.itemName,
          amount: isWithdraw ? -amt : amt,
          isFixed: isWithdraw ? false : form.isFixed,
        }
        await onSave(payload, isWithdraw ? 'single' : applyMode)
      }
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
                    onClick={() => {
                      setTxnDir(opt.value)
                      if (opt.value === 'withdraw') setApplyMode('single')
                    }}
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

          {/* Where the money comes out of — replaces free-text naming, which is
              what allowed an unattributed "Wintdraw" row to exist at all. */}
          {isWithdraw && (
            <FormControl size="small" fullWidth className={classes.fieldStyles}>
              <InputLabel id="withdraw-from-label" shrink sx={{ color: 'text.secondary' }}>
                Withdraw from
              </InputLabel>
              <Select
                native
                labelId="withdraw-from-label"
                value={withdrawFrom}
                onChange={e => setWithdrawFrom(e.target.value)}
                label="Withdraw from"
                notched
              >
                <option value="">-- Select investment --</option>
                {available.map(h => (
                  <option key={h.name} value={h.name}>
                    {h.name} ({inr(h.balance)} available)
                  </option>
                ))}
                {available.length > 1 && (
                  <option value={WITHDRAW_ALL}>All investments (split by size)</option>
                )}
              </Select>
            </FormControl>
          )}

          {/* Shows exactly what will be written before it is written. */}
          {splitAll && parts.length > 0 && (
            <Box sx={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', p: '10px 12px',
            }}>
              <Typography sx={{ fontSize: 11, color: '#8891b8', mb: '6px' }}>
                Will be taken out as:
              </Typography>
              {parts.map(p => (
                <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', py: '2px' }}>
                  <Typography sx={{ fontSize: 12, color: '#c8cfea' }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#ff5f5f', fontVariantNumeric: 'tabular-nums' }}>
                    −{inr(p.amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Item Name — a withdrawal takes its name from the dropdown above */}
          {!isWithdraw && (
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
          )}

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

          {!isWithdraw && (
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
          )}
        </Box>

        {/* Actions */}
        <Box className={classes.actionsContainer}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !valid}
            className={classes.saveButton}
            sx={overdrawn ? {
              background: '#ff5f5f !important',
              '&:hover': { background: '#e64a4a !important' },
            } : undefined}
          >
            {saving
              ? (form.id ? 'Updating...' : (isWithdraw ? 'Withdrawing...' : 'Adding...'))
              : overdrawn
                ? 'Withdraw anyway'
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
