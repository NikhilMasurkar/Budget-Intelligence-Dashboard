import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useBudgetProgressSectionUi, useCategoryTintUi } from '../styles/BudgetProgressSection.styles'

function CategoryDot({ color }) {
  const { classes } = useCategoryTintUi({ color })
  return <Box className={classes.dot} />
}

// Bar scaled to the biggest category, then the share of all spending.
function ShareBar({ color, width, pct, trackClass }) {
  const { classes } = useCategoryTintUi({ color, width })
  return (
    <>
      <Box className={trackClass}>
        <Box className={classes.bar} />
      </Box>
      <Typography className={classes.pct}>{pct.toFixed(1)}%</Typography>
    </>
  )
}

export default function BudgetProgressSection({ categories, expenses, selMonths, catMap, selSpend, investCatIds, onCategoryClick, onEditCategory, fmt, MONTHS }) {
  const { classes: ui, cx } = useBudgetProgressSectionUi()
  const catData = useMemo(() => {
    const grouped = {}
    // Investment categories are excluded: this table breaks down spending, and
    // selSpend (its 100% baseline) is now spending-only. Including them would
    // make the shares add up to more than 100%.
    expenses
      .filter(e => selMonths.includes(+e.month - 1) && !investCatIds?.has(e.categoryId))
      .forEach(e => {
      const cat = catMap[e.categoryId]
      const id = e.categoryId || 'other'
      if (!grouped[id]) {
        grouped[id] = {
          id,
          catName: cat?.name || id,
          color: cat?.color || 'var(--accent)',
          budget: cat?.budget || 0,
          total: 0,
          details: []
        }
      }
      grouped[id].total += +e.amount || 0
      grouped[id].details.push({
        name: e.itemName || 'Unnamed',
        month: MONTHS[+e.month - 1],
        amount: +e.amount || 0
      })
    })
    return Object.values(grouped).sort((a, b) => b.total - a.total)
  }, [expenses, selMonths, catMap, MONTHS, investCatIds])

  if (catData.length === 0) return null

  // Scale the share bars so top category = 100% bar width
  const maxTotal = catData[0]?.total || 1

  const budgetColLabel = selMonths.length === 1
    ? 'BUDGET/MO'
    : selMonths.length === 12
      ? 'ANNUAL BUDGET'
      : `BUDGET/${selMonths.length} MO`

  return (
    <Box className={ui.section}>
      <Box className={ui.header}>
        <Typography className={ui.title}>
          Budget Overview
        </Typography>
        <Typography className={ui.subtitle}>
          {selMonths.length} month{selMonths.length > 1 ? 's' : ''} · tap a row for full breakdown
        </Typography>
      </Box>

      <Box className={ui.table}>

        {/* Column headers */}
        <Box className={cx(ui.tableGrid, ui.headRow)}>
          {[
            { label: 'CATEGORY',    align: 'left',  xs: true  },
            { label: 'SHARE',       align: 'left',  xs: false },
            { label: 'TOTAL SPENT', align: 'right', xs: true  },
            { label: budgetColLabel,  align: 'right', xs: false },
            { label: 'STATUS',      align: 'right', xs: false },
          ].map(col => (
            <Typography key={col.label}
              className={cx(ui.colHead, col.align === 'right' && ui.colHeadRight, !col.xs && ui.colHeadWide)}>
              {col.label}
            </Typography>
          ))}
        </Box>

        {/* Data rows — every row is single-line, same height */}
        {catData.map((cat, i) => {
          const sharePct   = selSpend > 0 ? (cat.total / selSpend) * 100 : 0
          const shareBarW  = Math.max(0, (cat.total / maxTotal) * 100)   // scaled to max category; clamp negatives (net withdrawals)
          const budgetLimit = cat.budget * selMonths.length
          const isOver     = budgetLimit > 0 && cat.total > budgetLimit
          const isWarn     = !isOver && budgetLimit > 0 && (cat.total / budgetLimit) >= 0.80

          return (
            <Box
              key={cat.id}
              onClick={() => onCategoryClick(cat)}
              className={cx(ui.tableGrid, ui.row, i === catData.length - 1 && ui.rowLast)}
            >
              {/* Category dot + name */}
              <Box className={ui.categoryCell}>
                <CategoryDot color={cat.color} />
                <Typography className={ui.categoryName}>
                  {cat.catName}
                </Typography>
              </Box>

              {/* Share bar + % — desktop only */}
              <Box className={ui.shareCell}>
                <ShareBar color={cat.color} width={shareBarW} pct={sharePct} trackClass={ui.shareTrack} />
              </Box>

              {/* Total spent */}
              <Typography className={cx(ui.spent, cat.total < 0 && ui.spentNegative)}>
                {fmt(cat.total)}
              </Typography>

              {/* Budget column — desktop only */}
              <Box className={ui.budgetCell}>
                {budgetLimit > 0 ? (
                  <Typography className={ui.budgetAmount}>
                    {fmt(budgetLimit)}
                  </Typography>
                ) : onEditCategory ? (
                  <Typography className={ui.setBudget}
                    onClick={e => { e.stopPropagation(); onEditCategory(categories.find(c => c.id === cat.id) || cat) }}
                  >
                    + Set budget
                  </Typography>
                ) : (
                  <Typography className={ui.noBudget}>—</Typography>
                )}
              </Box>

              {/* Status — desktop full text, mobile badge */}
              <Box className={ui.statusCell}>
                {budgetLimit > 0 ? (
                  isOver ? (
                    <Typography className={ui.overText}>
                      ↑ {fmt(cat.total - budgetLimit)} <Box className={ui.overWord} component="span">over</Box>
                    </Typography>
                  ) : (
                    <Typography className={cx(ui.left, isWarn && ui.leftWarn)}>
                      {fmt(budgetLimit - cat.total)} <Box className={ui.leftWord} component="span">left</Box>
                    </Typography>
                  )
                ) : (
                  <Typography className={ui.noStatus}>—</Typography>
                )}
              </Box>
            </Box>
          )
        })}

        {/* Total row */}
        {catData.length > 1 && (
          <Box className={cx(ui.tableGrid, ui.totalRow)}>
            <Typography className={ui.totalLabel}>
              Total
            </Typography>
            <Box className={ui.totalShareGap} />
            <Typography className={ui.totalAmount}>
              {fmt(selSpend)}
            </Typography>
            <Box className={ui.totalBudgetGap} />
            <Box />
          </Box>
        )}
      </Box>
    </Box>
  )
}
