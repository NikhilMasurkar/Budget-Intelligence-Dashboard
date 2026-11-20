import { useState, useEffect } from 'react'
import { Box, Typography, Button } from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { fmt } from '../../utils/constants'
import { useExpensesByCategoryStyles } from './styles/ExpensesByCategory.styles'
import { useExpenseBarsUi, useFillWidth } from './styles/ExpenseBars.styles'

// Compact budget-vs-actual text shown in a category header when a budget is set.
export function CategoryBudgetText({ actual, budget }) {
  const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0
  const over = actual > budget
  const { classes: ui, cx } = useExpenseBarsUi()
  return (
    <Typography className={cx(ui.budgetText, over ? ui.budgetOver : pct > 80 && ui.budgetWarn)}>
      Budget {fmt(actual)} / {fmt(budget)} · {pct}%{over ? ' · over' : ''}
    </Typography>
  )
}

// The month's money story: income · spent · invested · remaining, and a bar.
export function MonthSummaryBar({ monthLabel, income, realSpend, invested, itemCount }) {
  const { classes: ui, cx } = useExpenseBarsUi()
  const { classes } = useExpensesByCategoryStyles()
  const remaining = income - realSpend - invested
  const spentPct = income > 0 ? Math.min(100, Math.round(((realSpend + invested) / income) * 100)) : 0
  const { classes: width } = useFillWidth(spentPct)
  const items = `${itemCount} item${itemCount !== 1 ? 's' : ''}`
  const stat = (label, value, tone) => (
    <Box className={classes.statBlock}>
      <Typography className={classes.statLabel}>{label}</Typography>
      <Typography className={cx(classes.statValue, ui[tone])}>{fmt(value)}</Typography>
    </Box>
  )
  return (
    <Box className={classes.totalBar}>
      {stat(`${monthLabel} Income`, income, 'income')}
      {stat('Spent', realSpend, 'spent')}
      {invested !== 0 && stat('Invested', invested, 'invested')}
      {stat(remaining >= 0 ? 'Remaining' : 'Short by', Math.abs(remaining), remaining >= 0 ? 'remaining' : 'spent')}
      <Box className={ui.usage}>
        <Box className={ui.usageTrack}>
          <Box className={cx(ui.fill, width.width, spentPct >= 100 ? ui.fillFull : spentPct > 80 && ui.fillWarn)} />
        </Box>
        <Typography className={ui.usageText}>
          {income > 0 ? `${spentPct}% of income used · ${items}` : items}
        </Typography>
      </Box>
    </Box>
  )
}

// Sticky bar for the selected expenses: pin, unpin, copy, delete (asks first).
export function BulkActionBar({ selected, onPin, onCopy, onDelete, onClear }) {
  const { classes: ui, cx } = useExpenseBarsUi()
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { setConfirm(false) }, [selected])
  return (
    <Box className={ui.bulkBar}>
      <Typography className={ui.bulkCount}>
        {selected.length} selected
      </Typography>
      <Box className={ui.bulkSpacer} />
      {confirm ? (
        <>
          <Typography className={ui.deleteQuestion}>Delete {selected.length}?</Typography>
          <Button size="small" variant="contained" onClick={() => { onDelete(selected); setConfirm(false) }}
            className={cx(ui.bulkBtn, ui.bulkDanger)}>
            Yes, delete
          </Button>
          <Button className={ui.bulkCancel} size="small" variant="text" onClick={() => setConfirm(false)}
           >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button size="small" variant="contained" startIcon={<PushPinIcon className={ui.pinIcon} />}
            onClick={() => onPin(selected, true)}
            className={cx(ui.bulkBtn, ui.bulkPrimary)}>
            Pin
          </Button>
          <Button size="small" variant="outlined" onClick={() => onPin(selected, false)}
            className={cx(ui.bulkBtn, ui.bulkAccentOutline)}>
            Unpin
          </Button>
          <Button size="small" variant="outlined" onClick={() => onCopy(selected.map(e => e.id))}
            className={cx(ui.bulkBtn, ui.bulkPlainOutline)}>
            📋 Copy to next month
          </Button>
          <Button size="small" variant="outlined" startIcon={<DeleteOutlinedIcon className={ui.deleteIcon} />}
            onClick={() => setConfirm(true)}
            className={cx(ui.bulkBtn, ui.bulkDangerOutline)}>
            Delete
          </Button>
          <Button className={ui.bulkClear} size="small" variant="text" onClick={onClear}
           >
            Clear
          </Button>
        </>
      )}
    </Box>
  )
}
