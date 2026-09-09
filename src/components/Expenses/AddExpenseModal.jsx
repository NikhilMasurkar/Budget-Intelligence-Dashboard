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
} from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { useAddExpenseModalStyles } from './styles/Expenses.styles'

import { MONTHS } from '../../utils/constants'
import { isInvestmentCategory, splitWithdrawal, applyAmountExpression } from '../../utils/money'
import { appendComment } from '../../utils/comments'
import AmountKeypad from './AmountKeypad'

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
  // The amount the expense had when the modal opened. Expressions like "+200"
  // are applied against this, so re-typing does not compound.
  const baseAmount = Math.abs(+initialAmt || 0)
  const [comment, setComment] = useState('')
  const [padOpen, setPadOpen] = useState(false)
  // Pressing "=" rewrites the field with the result, which erases the fact that
  // an adjustment was made. Remember it so the comment log still reads
  // "+₹200 · ₹5,000 → ₹5,200" rather than just the new total.
  const [resolvedExpr, setResolvedExpr] = useState(null)

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
  // "+200" / "-10" / "*2" adjust the amount the row opened with; a bare number
  // replaces it. Null when the field cannot be read at all.
  const expr = applyAmountExpression(baseAmount, form.amount)
  const amt = expr ? Math.abs(expr.value) : 0
  // Covers the case where "=" already folded the expression into a plain
  // number, so the saved comment can still say what the adjustment was.
  const shownExpr = (expr && expr.op !== null) ? expr : resolvedExpr
  const adjusted = !!shownExpr
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

  const valid = form.categoryId && amt > 0 && (
    isWithdraw ? (splitAll ? parts.length > 0 : !!withdrawFrom) : form.itemName.trim()
  )

  // One comment entry combining the amount change and the typed note. Either
  // part may be absent; if both are, nothing is logged.
  //
  // The money line is only meaningful when editing an existing row — on a new
  // expense there is nothing to compare against — and is skipped for a split
  // withdrawal, where each row gets its own share and the total would be wrong
  // stamped on every one of them.
  const changeLog = ({ withMoney = true } = {}) => {
    const note = comment.trim()
    const amountChanged = !!form.id && withMoney && amt !== baseAmount
    if (!amountChanged) return note

    const money = adjusted
      ? `${shownExpr.op === '-' ? '−' : shownExpr.op}`
      + `${shownExpr.op === '+' || shownExpr.op === '-' ? inr(shownExpr.operand) : shownExpr.operand}`
      + ` · ${inr(baseAmount)} → ${inr(amt)}`
      : `${inr(baseAmount)} → ${inr(amt)}`
    return note ? `${money} — ${note}` : money
  }

  const handleSave = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      // A withdrawal can't be "fixed/recurring" (the toggle is hidden for it),
      // so never persist a stale isFixed=true left over from before the switch.
      if (splitAll) {
        // One row per pot so each balance drops by its own share.
        await onSave(
          parts.map(p => ({
            ...form, itemName: p.name, amount: -p.amount, isFixed: false,
            note: appendComment(form.note, changeLog({ withMoney: false })),
          })),
          'split'
        )
      } else {
        const payload = {
          ...form,
          itemName: isWithdraw ? withdrawFrom : form.itemName,
          amount: isWithdraw ? -amt : amt,
          isFixed: isWithdraw ? false : form.isFixed,
          // Log the adjustment and the note into the same comment thread, so
          // the row carries a history of what changed and why.
          note: appendComment(form.note, changeLog()),
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
            // Deliberately text, not number: type="number" rejects "+200".
            type="text"
            // "none" asks the browser not to raise the system keyboard while
            // still allowing focus, a caret and a physical keyboard — the pad
            // below drives this field. Set unconditionally: flipping it after
            // focus does not reliably dismiss a keyboard that already opened.
            // Text fields in this modal are untouched and behave normally.
            value={form.amount}
            onChange={e => { setResolvedExpr(null); set('amount', e.target.value) }}
            onFocus={() => setPadOpen(true)}
            onClick={() => setPadOpen(true)}
            placeholder={baseAmount ? 'e.g. +200, -50, *2 or a new amount' : '0'}
            fullWidth
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            // inputMode has to go through slotProps.htmlInput to land on the
            // actual <input>; TextField forwards unrecognised props to the root
            // FormControl, so a bare inputMode="none" silently did nothing and
            // the system keyboard still covered the on-screen pad.
            slotProps={{ htmlInput: { inputMode: 'none' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: 'text.secondary', fontWeight: 600, fontSize: 13 } }}>₹</InputAdornment>,
            }}
            className={classes.fieldStyles}
          />

          {/* Show the resolved sum before it is saved, so an expression is never
              a guess. Also flags input the parser could not read at all. */}
          {adjusted && (
            <Box sx={{
              width: '100%', mt: '-4px',
              background: 'rgba(91,127,255,0.08)', border: '1px solid rgba(91,127,255,0.3)',
              borderRadius: '8px', p: '8px 12px',
            }}>
              <Typography sx={{ fontSize: 12, color: '#a0b4ff', fontVariantNumeric: 'tabular-nums' }}>
                {inr(baseAmount)} {expr.op === '-' ? '−' : expr.op} {expr.operand} = <b>{inr(amt)}</b>
              </Typography>
            </Box>
          )}
          {form.amount.trim() && !expr && (
            <Typography sx={{ width: '100%', mt: '-4px', fontSize: 11.5, color: '#ff7a7a' }}>
              Can't read that — type a number, or +200 / -50 / *2 to adjust the current amount.
            </Typography>
          )}

          {padOpen && (
            <AmountKeypad
              value={form.amount}
              onChange={(v) => { setResolvedExpr(null); set('amount', v) }}
              onDone={() => setPadOpen(false)}
              resultLabel={expr ? `= ${inr(amt)}` : null}
              onEquals={() => {
                if (!expr) return
                // Fold the expression into a plain number, remembering what it
                // was so the saved comment still explains the change.
                if (expr.op !== null) setResolvedExpr(expr)
                set('amount', String(expr.value))
              }}
            />
          )}

          {/* Note goes into the same comment thread the row already uses, next
              to the amount change that prompted it. */}
          <TextField
            label={adjusted ? 'Why the change? (optional)' : 'Comment (optional)'}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={adjusted ? 'e.g. bought extra milk' : 'Add a note for this expense'}
            fullWidth
            multiline
            maxRows={3}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
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
