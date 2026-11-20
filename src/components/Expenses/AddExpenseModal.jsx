import { useState, useMemo } from 'react'
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
  Collapse,
} from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { useAddExpenseModalStyles } from './styles/Expenses.styles'

import { MONTHS } from '../../utils/constants'
import { isInvestmentCategory, splitWithdrawal, applyAmountExpression, upiTopUp } from '../../utils/money'
import { appendComment } from '../../utils/comments'
import AmountKeypad from './AmountKeypad'
import UpiPayButtons, { canPayByUpi, openUpiApp } from './UpiPayButtons'

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

const WITHDRAW_ALL = '__all__'

export default function AddExpenseModal({ initial, categories, year, month, availableYears = [new Date().getFullYear()], holdings = [], suggestions = [], expenses = [], onSave, onClose }) {
  const { classes } = useAddExpenseModalStyles()
  // An existing item picked from the chips (weekly Petrol): the form then adds
  // to it instead of creating a new row. Stands in for `initial` while set.
  const [picked, setPicked] = useState(null)
  const initialAmt = picked ? picked.amount : initial?.amount
  const [form, setForm] = useState({
    id: initial?.id || '',
    year: initial?.year || year,
    month: initial?.month || month,
    // Category first: a fresh add starts with none chosen.
    categoryId: initial?.categoryId || '',
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
  const [moreOpen, setMoreOpen] = useState(false)
  // Set once the user picks a category themselves; item-name suggestions then
  // stop overriding it.
  const [catTouched, setCatTouched] = useState(false)
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

  // Items already in this month + category, for the chips (fresh add only).
  const existingItems = useMemo(() => (initial?.id || !form.categoryId) ? [] : expenses.filter(e =>
    String(e.year) === String(form.year) && String(e.month) === String(form.month)
    && e.categoryId === form.categoryId && +e.amount > 0), [expenses, initial, form.year, form.month, form.categoryId])

  // "+" pre-filled, so typing 500 means "+500": added to the item's total.
  const pick = (e) => {
    setPicked(e)
    setResolvedExpr(null)
    setForm(f => ({ ...f, id: e.id, itemName: e.itemName, amount: '+', isFixed: e.isFixed === 'TRUE' || e.isFixed === true, note: e.note || '' }))
  }
  const unpick = () => {
    if (!picked) return
    setPicked(null)
    setForm(f => ({ ...f, id: '', itemName: '', amount: '', isFixed: false, note: '' }))
  }
  // A different month or category means a different list — drop the pick.
  const setWhere = (k, v) => { unpick(); set(k, v) }

  // Typing a name used before files it under that name's last category — only
  // for a fresh add from the generic button, and only until the user picks one.
  const handleItemName = (v) => {
    set('itemName', v)
    if (form.id || initial?.categoryId || catTouched) return
    const hit = suggestions.find(s => s.name.toLowerCase() === v.trim().toLowerCase())
    if (hit && categories.some(c => c.id === hit.categoryId)) set('categoryId', hit.categoryId)
  }

  const applyOptions = [
    { value: 'single', label: 'This month only' },
    { value: 'all_year', label: 'Whole year' },
    { value: 'this_and_forward', label: `${MONTHS[(form.month || 1) - 1]} → Dec` },
  ]
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
  const shownExpr = expr?.label ? expr : resolvedExpr
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

    // "₹5,000 + ₹200 + ₹300 = ₹5,500" when adjusting the old amount;
    // "₹5,000 → ₹700 · ₹500 + ₹200" when a fresh sum replaced it.
    const money = !adjusted
      ? `${inr(baseAmount)} → ${inr(amt)}`
      : shownExpr.relative
        ? `${shownExpr.label} = ${inr(amt)}`
        : `${inr(baseAmount)} → ${inr(amt)} · ${shownExpr.label}`
    return note ? `${money} — ${note}` : money
  }

  // What a UPI payment adds to an existing item: "+500" (or "+500" folded by
  // "=") is already relative; a bare "500" means "paid 500 more".
  // The field opens holding the current total — untouched, it adds nothing.
  const upiAdd = upiTopUp({ editing: !!form.id, amount: amt, base: baseAmount, relative: !!shownExpr?.relative, raw: form.amount })

  const handleSave = async (payWith) => {
    if (!valid || saving) return
    setSaving(true)
    try {
      if (payWith) {
        // On an existing item (weekly Petrol) a payment is a top-up: "500" adds
        // ₹500, same as "+500". Logged as "₹2,000 + ₹500 = ₹2,500 · via BHIM".
        const total = form.id ? baseAmount + upiAdd : amt
        const typed = comment.trim()
        const line = (form.id ? `${inr(baseAmount)} + ${inr(upiAdd)} = ${inr(total)} · ` : '') + `via ${payWith.label}`
        const payload = { ...form, amount: total, note: appendComment(form.note, typed ? `${line} — ${typed}` : line) }
        await onSave(payload, 'single')
        openUpiApp(payWith)
        return
      }
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
            : picked ? `Add to ${picked.itemName}` : (form.id ? 'Edit Expense' : 'Add Expense')}
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
                onChange={e => setWhere('year', e.target.value)}
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
                onChange={e => setWhere('month', +e.target.value)}
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
              onChange={e => { setCatTouched(true); setWhere('categoryId', e.target.value) }}
              label="Category"
              notched
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormControl>

          {/* Already this month in the chosen category: pick one to add to it. */}
          {!isWithdraw && existingItems.length > 0 && (
            <FormControl size="small" fullWidth className={classes.fieldStyles}>
              <InputLabel id="expense-item-label" shrink sx={{ color: 'text.secondary' }}>
                Item
              </InputLabel>
              <Select
                native
                labelId="expense-item-label"
                value={picked?.id || ''}
                onChange={e => {
                  const hit = existingItems.find(x => x.id === e.target.value)
                  hit ? pick(hit) : unpick()
                }}
                disabled={saving}
                label="Item"
                notched
              >
                <option value="">+ New item</option>
                {existingItems.map(e => <option key={e.id} value={e.id}>{e.itemName} ({inr(+e.amount)})</option>)}
              </Select>
            </FormControl>
          )}

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
                      background: 'var(--danger) !important',
                      borderColor: 'var(--danger) !important',
                      '&:hover': { background: 'var(--danger-strong) !important' },
                    } : undefined}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
              <Typography sx={{ fontSize: 11, color: 'var(--text2)', mt: '6px' }}>
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
              width: '100%', background: 'rgb(var(--ink-rgb) / 0.03)',
              border: '1px solid rgb(var(--ink-rgb) / 0.07)', borderRadius: '8px', p: '10px 12px',
            }}>
              <Typography sx={{ fontSize: 11, color: 'var(--text2)', mb: '6px' }}>
                Will be taken out as:
              </Typography>
              {parts.map(p => (
                <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', py: '2px' }}>
                  <Typography sx={{ fontSize: 12, color: 'var(--text-soft)' }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
                    −{inr(p.amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Item Name — a withdrawal takes its name from the dropdown above */}
          {!isWithdraw && !picked && (
            <>
              <TextField
                label={existingItems.length ? 'New item name' : 'Item Name'}
                value={form.itemName}
                onChange={e => handleItemName(e.target.value)}
                placeholder="e.g. Electricity Bill"
                fullWidth
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                slotProps={{ htmlInput: { list: 'expense-item-suggestions' } }}
                className={classes.fieldStyles}
              />
              <datalist id="expense-item-suggestions">
                {suggestions.map(s => <option key={s.name} value={s.name} />)}
              </datalist>
            </>
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
            placeholder={baseAmount ? 'e.g. +200+150 to add, -50, or a new amount' : 'e.g. 450 or 200+150+80'}
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
          {expr?.label && (
            <Box sx={{
              width: '100%', mt: '-4px',
              background: 'rgb(var(--accent-rgb) / 0.08)', border: '1px solid rgb(var(--accent-rgb) / 0.3)',
              borderRadius: '8px', p: '8px 12px',
            }}>
              <Typography sx={{ fontSize: 12, color: 'var(--accent-soft)', fontVariantNumeric: 'tabular-nums' }}>
                {expr.label} = <b>{inr(amt)}</b>
              </Typography>
            </Box>
          )}
          {form.amount.trim() && !expr && (
            <Typography sx={{ width: '100%', mt: '-4px', fontSize: 11.5, color: 'var(--danger-soft)' }}>
              Can't read that — type a number, a sum like 200+150, or +200 to add to the current amount.
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
                if (expr.label) setResolvedExpr(expr)
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
              background: form.isFixed ? 'rgb(var(--accent-rgb) / 0.08)' : 'rgb(var(--ink-rgb) / 0.03)',
              border: `1px solid ${form.isFixed ? 'rgb(var(--accent-rgb) / 0.3)' : 'rgb(var(--ink-rgb) / 0.07)'}`,
              transition: 'all 0.2s'
            }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: form.isFixed ? 'var(--accent-soft)' : 'var(--text2)' }}>
                  📌 Fixed / Recurring
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'var(--text2)', mt: '2px' }}>
                  Auto-copied to next month at start
                </Typography>
              </Box>
              <Switch
                checked={form.isFixed}
                onChange={e => set('isFixed', e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--accent)' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--accent)' }
                }}
              />
            </Box>
          )}

          {!isWithdraw && (
            <Box style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* Rarely used, so tucked away — but a non-default choice stays
                  named on the toggle so a save never fans out invisibly. */}
              <Button
                variant="text"
                size="small"
                onClick={() => setMoreOpen(o => !o)}
                aria-expanded={moreOpen}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'var(--text2)', fontSize: 12, px: '4px', minWidth: 0 }}
              >
                {moreOpen ? '▾' : '▸'} More options
                {applyMode !== 'single' && ` · ${applyOptions.find(o => o.value === applyMode).label}`}
              </Button>
              <Collapse in={moreOpen}>
                <Typography variant="caption" component="div" className={classes.applyLabel} sx={{ mt: '6px' }}>
                  Apply to
                </Typography>
                <Box className={classes.applyButtonContainer}>
                  {applyOptions.map(opt => (
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
              </Collapse>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box className={classes.actionsContainer}>
          <Button
            variant="contained"
            onClick={() => handleSave()}
            disabled={saving || !valid}
            className={classes.saveButton}
            sx={overdrawn ? {
              background: 'var(--danger) !important',
              '&:hover': { background: 'var(--danger-strong) !important' },
            } : undefined}
          >
            {saving
              ? (form.id ? 'Updating...' : (isWithdraw ? 'Withdrawing...' : 'Adding...'))
              : overdrawn
                ? 'Withdraw anyway'
                : isWithdraw
                  ? (form.id ? 'Update Withdrawal' : 'Withdraw')
                  : picked ? `Add to ${picked.itemName}` : (form.id ? 'Update Expense' : 'Add Expense')}
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

        {canPayByUpi && !isWithdraw && (
          <UpiPayButtons
            caption={!form.id ? 'Save & pay with'
              : upiAdd > 0 ? `Add ${inr(upiAdd)} (total ${inr(baseAmount + upiAdd)}) & pay with`
                : `Type this payment's amount, then pay with`}
            disabled={saving || !valid || upiAdd <= 0}
            onPay={handleSave}
          />
        )}

      </Box>
    </Dialog>
  )
}
