import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'

function RingGauge({ pct, color, size = 70 }) {
  const r = (size / 2) - 7
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(pct / 100, 1)) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

export default function KPICardsSection({ selIncome, selExpense, selNetSav, selInvest, selMonths, categories, expenses, fmt }) {

  // ── Card 1: Cash Savings (liquid cash remaining after all expenses) ──────
  const cashPct    = selIncome > 0 ? (selNetSav / selIncome) * 100 : 0
  const cashColor  = selNetSav >= 0 ? (cashPct >= 10 ? '#3de8a0' : '#ffb347') : '#ff5f5f'
  const cashMsg    = selNetSav >= 0 ? 'liquid cash remaining' : 'spending over income'

  // ── Card 2: Budget Health ─────────────────────────────────────
  const { onTrack, totalBudget, overCount } = useMemo(() => {
    const budgetCats = categories.filter(c => c.budget > 0)
    const catSpend = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      catSpend[e.categoryId] = (catSpend[e.categoryId] || 0) + (+e.amount || 0)
    })
    const over = budgetCats.filter(c => (catSpend[c.id] || 0) > c.budget * selMonths.length).length
    return { onTrack: budgetCats.length - over, totalBudget: budgetCats.length, overCount: over }
  }, [categories, expenses, selMonths])

  const healthPct   = totalBudget > 0 ? (onTrack / totalBudget) * 100 : 100
  const healthColor = healthPct >= 80 ? '#3de8a0' : healthPct >= 50 ? '#ffb347' : '#ff5f5f'
  const healthMsg   = overCount === 0
    ? 'All within budget'
    : `${overCount} categor${overCount === 1 ? 'y' : 'ies'} over budget`

  // ── Card 3: Monthly Burn Rate ─────────────────────────────────
  const burnRate     = selMonths.length > 0 ? selExpense / selMonths.length : selExpense
  const monthlyInc   = selMonths.length > 0 ? selIncome  / selMonths.length : selIncome
  const burnPct      = monthlyInc > 0 ? (burnRate / monthlyInc) * 100 : 0
  const burnColor    = burnPct <= 70 ? '#3de8a0' : burnPct <= 90 ? '#ffb347' : '#ff5f5f'
  const burnMsg      = selMonths.length > 1 ? `avg over ${selMonths.length} months` : 'this month'

  const cards = [
    {
      label:     'CASH SAVINGS',
      ringPct:   Math.min(Math.abs(cashPct), 100),
      ringLabel: `${Math.abs(cashPct).toFixed(0)}%`,
      value:     (selNetSav >= 0 ? '+' : '') + fmt(selNetSav),
      suffix:    null,
      sub:       cashMsg,
      color:     cashColor,
    },
    {
      label:     'BUDGET HEALTH',
      ringPct:   healthPct,
      ringLabel: totalBudget > 0 ? `${onTrack}/${totalBudget}` : '—',
      value:     totalBudget > 0 ? `${onTrack} on track` : 'No budgets set',
      suffix:    null,
      sub:       healthMsg,
      color:     healthColor,
    },
    {
      label:     'MONTHLY BURN',
      ringPct:   Math.min(burnPct, 100),
      ringLabel: `${Math.round(burnPct)}%`,
      value:     fmt(burnRate),
      suffix:    '/mo',
      sub:       burnMsg,
      color:     burnColor,
    },
  ]

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      gap: '14px',
      mb: '18px',
    }}>
      {cards.map((card, i) => (
        <Box key={i} sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${card.color}0d 0%, transparent 65%), #14172a`,
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: `3px solid ${card.color}`,
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          overflow: 'hidden',
          transition: 'box-shadow 0.15s ease',
          '&:hover': { boxShadow: `0 8px 32px ${card.color}18` },
        }}>
          {/* Glow blob */}
          <Box sx={{ position: 'absolute', top: -24, right: -24, width: 90, height: 90, borderRadius: '50%', background: `${card.color}08`, pointerEvents: 'none' }} />

          {/* Ring + center label */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <RingGauge pct={card.ringPct} color={card.color} size={70} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{
                fontSize: card.ringLabel.length > 4 ? 10 : 13,
                fontWeight: 800, color: card.color,
                fontVariantNumeric: 'tabular-nums', lineHeight: 1, textAlign: 'center',
              }}>
                {card.ringLabel}
              </Typography>
            </Box>
          </Box>

          {/* Text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#3a4060', letterSpacing: '0.7px', textTransform: 'uppercase', mb: '7px' }}>
              {card.label}
            </Typography>
            <Typography sx={{
              fontSize: 19, fontWeight: 800, color: '#e4e8f5',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, mb: '5px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {card.value}
              {card.suffix && (
                <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: '#6a7190', ml: '3px' }}>
                  {card.suffix}
                </Box>
              )}
            </Typography>
            <Typography sx={{ fontSize: 11, color: card.color, fontWeight: 600 }}>
              {card.sub}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}
