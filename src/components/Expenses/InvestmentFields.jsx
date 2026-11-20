import { Button, FormControl, InputLabel, Select, Box, Typography } from '@mui/material'
import { useAddExpenseModalStyles } from './styles/Expenses.styles'
import { useInvestmentFieldsUi } from './styles/InvestmentFields.styles'

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const WITHDRAW_ALL = '__all__'

// Savings / investment categories only: deposit or withdraw, which pot a
// withdrawal comes out of, and how a split withdrawal will be written.
export default function InvestmentFields({ txnDir, onDir, saving, isWithdraw, withdrawFrom, setWithdrawFrom, available, parts }) {
  const { classes: ui, cx: uiCx } = useInvestmentFieldsUi()
  const { classes } = useAddExpenseModalStyles()
  return (
    <>
      <Box className={ui.directionField}>
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
              onClick={() => onDir(opt.value)}
              disabled={saving}
              className={txnDir === opt.value
                ? uiCx(classes.applyButtonActive, opt.value === 'withdraw' && ui.withdrawActive)
                : classes.applyButtonInactive}
            >
              {opt.label}
            </Button>
          ))}
        </Box>
        <Typography className={ui.directionHint}>
          {isWithdraw
            ? 'Reduces this investment’s balance; the money returns to your spendable cash.'
            : 'Adds money into this investment / savings pot.'}
        </Typography>
      </Box>

    {/* Where the money comes out of — replaces free-text naming, which is
        what allowed an unattributed "Wintdraw" row to exist at all. */}
    {isWithdraw && (
      <FormControl size="small" fullWidth className={classes.fieldStyles}>
        <InputLabel className={ui.withdrawFromLabel} id="withdraw-from-label" shrink>
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
    {parts.length > 0 && (
      <Box className={ui.partsPreview}>
        <Typography className={ui.partsTitle}>
          Will be taken out as:
        </Typography>
        {parts.map(p => (
          <Box className={ui.partRow} key={p.name}>
            <Typography className={ui.partName}>{p.name}</Typography>
            <Typography className={ui.partAmount}>
              −{inr(p.amount)}
            </Typography>
          </Box>
        ))}
      </Box>
    )}
    </>
  )
}
