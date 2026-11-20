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

import InvestmentFields, { WITHDRAW_ALL, inr } from './InvestmentFields'
import { useAddExpenseModalUi } from './styles/AddExpenseModal.styles'

export default function AddExpenseModal({ initial, categories, year, month, availableYears = [new Date().getFullYear()], holdings = [], suggestions = [], expenses = [], onSave, onClose }) {
  const { classes: ui, cx: uiCx } = useAddExpenseModalUi()
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
    isFixed: initial?.isFixed === true,
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
    setForm(f => ({ ...f, id: e.id, itemName: e.itemName, amount: '+', isFixed: e.isFixed === true, note: e.note || '' }))
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
          <ReceiptLongOutlinedIcon className={ui.headerIcon} color="error" />
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
            <FormControl size="small" className={uiCx(classes.fieldStyles, ui.halfField)}>
              <InputLabel className={ui.yearLabel} id="expense-year-label" shrink>
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

            <FormControl size="small" className={uiCx(classes.fieldStyles, ui.halfField)}>
              <InputLabel className={ui.monthLabel} id="expense-month-label" shrink>
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
            <InputLabel className={ui.categoryLabel} id="expense-category-label" shrink>
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
              <InputLabel className={ui.itemLabel} id="expense-item-label" shrink>
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

          {isSavings && (
            <InvestmentFields
              txnDir={txnDir} saving={saving} isWithdraw={isWithdraw}
              onDir={v => { setTxnDir(v); if (v === 'withdraw') setApplyMode('single') }}
              withdrawFrom={withdrawFrom} setWithdrawFrom={setWithdrawFrom}
              available={available} parts={splitAll ? parts : []}
            />
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
              startAdornment: <InputAdornment className={ui.rupeeAdornment} position="start">₹</InputAdornment>,
            }}
            className={classes.fieldStyles}
          />

          {/* Show the resolved sum before it is saved, so an expression is never
              a guess. Also flags input the parser could not read at all. */}
          {expr?.label && (
            <Box className={ui.sumPreview}>
              <Typography className={ui.sumPreviewText}>
                {expr.label} = <b>{inr(amt)}</b>
              </Typography>
            </Box>
          )}
          {form.amount.trim() && !expr && (
            <Typography className={ui.amountError}>
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
            <Box className={uiCx(ui.fixedBox, form.isFixed && ui.fixedBoxOn)}>
              <Box>
                <Typography className={uiCx(ui.fixedLabel, form.isFixed && ui.fixedLabelOn)}>
                  📌 Fixed / Recurring
                </Typography>
                <Typography className={ui.fixedHint}>
                  Auto-copied to next month at start
                </Typography>
              </Box>
              <Switch className={ui.fixedSwitch}
                checked={form.isFixed}
                onChange={e => set('isFixed', e.target.checked)}
                size="small"
              />
            </Box>
          )}

          {!isWithdraw && (
            <Box className={ui.moreOptions}>
              {/* Rarely used, so tucked away — but a non-default choice stays
                  named on the toggle so a save never fans out invisibly. */}
              <Button className={ui.moreOptionsToggle}
                variant="text"
                size="small"
                onClick={() => setMoreOpen(o => !o)}
                aria-expanded={moreOpen}
              >
                {moreOpen ? '▾' : '▸'} More options
                {applyMode !== 'single' && ` · ${applyOptions.find(o => o.value === applyMode).label}`}
              </Button>
              <Collapse in={moreOpen}>
                <Typography variant="caption" component="div" className={uiCx(classes.applyLabel, ui.applyToLabel)}>
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
            className={uiCx(classes.saveButton, overdrawn && ui.saveOverdrawn)}
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
