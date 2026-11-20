import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'

export default function BudgetProgressSection({ categories, expenses, selMonths, catMap, selSpend, investCatIds, onCategoryClick, onEditCategory, fmt, MONTHS }) {
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

  const COLS = { xs: '1fr 100px 110px', md: '1fr 170px 110px 110px 130px' }

  const budgetColLabel = selMonths.length === 1
    ? 'BUDGET/MO'
    : selMonths.length === 12
      ? 'ANNUAL BUDGET'
      : `BUDGET/${selMonths.length} MO`

  return (
    <Box sx={{ mb: '18px' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px', mb: '12px' }}>
        <Typography sx={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>
          Budget Overview
        </Typography>
        <Typography sx={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {selMonths.length} month{selMonths.length > 1 ? 's' : ''} · tap a row for full breakdown
        </Typography>
      </Box>

      <Box sx={{ background: 'var(--surface2)', border: '1px solid rgb(var(--ink-rgb) / 0.07)', borderRadius: '14px', overflow: 'hidden' }}>

        {/* Column headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: COLS, px: '16px', py: '8px', borderBottom: '1px solid rgb(var(--ink-rgb) / 0.05)', background: 'rgb(var(--ink-rgb) / 0.02)' }}>
          {[
            { label: 'CATEGORY',    align: 'left',  xs: true  },
            { label: 'SHARE',       align: 'left',  xs: false },
            { label: 'TOTAL SPENT', align: 'right', xs: true  },
            { label: budgetColLabel,  align: 'right', xs: false },
            { label: 'STATUS',      align: 'right', xs: false },
          ].map(col => (
            <Typography key={col.label} sx={{
              fontSize: 10, fontWeight: 700, color: 'var(--line)',
              letterSpacing: '0.6px', textTransform: 'uppercase',
              textAlign: col.align,
              display: col.xs ? 'block' : { xs: 'none', md: 'block' },
              pr: col.align === 'right' ? '12px' : 0,
            }}>
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
          const statusColor = isOver ? 'var(--danger)' : isWarn ? 'var(--warn)' : 'var(--accent2)'

          return (
            <Box
              key={cat.id}
              onClick={() => onCategoryClick(cat)}
              sx={{
                display: 'grid',
                gridTemplateColumns: COLS,
                alignItems: 'center',
                px: '16px',
                py: '11px',
                borderBottom: i < catData.length - 1 ? '1px solid rgb(var(--ink-rgb) / 0.04)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
                '&:hover': { background: 'rgb(var(--ink-rgb) / 0.025)' },
              }}
            >
              {/* Category dot + name */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, pr: '12px' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: cat.color, boxShadow: `0 0 5px ${cat.color}60` }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.catName}
                </Typography>
              </Box>

              {/* Share bar + % — desktop only */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '8px', pr: '16px' }}>
                <Box sx={{ flex: 1, height: 5, borderRadius: 3, background: 'rgb(var(--ink-rgb) / 0.05)', overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${shareBarW}%`, background: cat.color, opacity: 0.75, borderRadius: 3 }} />
                </Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: cat.color, minWidth: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {sharePct.toFixed(1)}%
                </Typography>
              </Box>

              {/* Total spent */}
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: cat.total < 0 ? 'var(--danger)' : 'var(--text)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', pr: '12px' }}>
                {fmt(cat.total)}
              </Typography>

              {/* Budget column — desktop only */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', pr: '12px' }}>
                {budgetLimit > 0 ? (
                  <Typography sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                    {fmt(budgetLimit)}
                  </Typography>
                ) : onEditCategory ? (
                  <Typography
                    onClick={e => { e.stopPropagation(); onEditCategory(categories.find(c => c.id === cat.id) || cat) }}
                    sx={{ fontSize: 11, color: 'var(--line)', cursor: 'pointer', '&:hover': { color: 'var(--accent)' } }}
                  >
                    + Set budget
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: 11, color: 'var(--line)' }}>—</Typography>
                )}
              </Box>

              {/* Status — desktop full text, mobile badge */}
              <Box sx={{ textAlign: 'right' }}>
                {budgetLimit > 0 ? (
                  isOver ? (
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      ↑ {fmt(cat.total - budgetLimit)} <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>over</Box>
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: statusColor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {fmt(budgetLimit - cat.total)} <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>left</Box>
                    </Typography>
                  )
                ) : (
                  <Typography sx={{ fontSize: 11, color: 'var(--line)' }}>—</Typography>
                )}
              </Box>
            </Box>
          )
        })}

        {/* Total row */}
        {catData.length > 1 && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: COLS,
            alignItems: 'center',
            px: '16px', py: '10px',
            borderTop: '1px solid rgb(var(--ink-rgb) / 0.06)',
            background: 'rgb(var(--ink-rgb) / 0.02)',
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'var(--line)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-soft)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', pr: '12px' }}>
              {fmt(selSpend)}
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }} />
            <Box />
          </Box>
        )}
      </Box>
    </Box>
  )
}
