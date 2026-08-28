import React from 'react'
import { Box, Typography } from '@mui/material'

// One block, four numbers, in the order money actually moves:
//
//   Earned − Spent = Kept,   and   Kept = Invested + Cash left
//
// Replaces the old 3 KPI rings + 2 wealth cards, which showed the same three
// values under five different names and six different percentages. Investing is
// a transfer between your own pockets, not spending — so it is subtracted from
// "Kept", never from "Earned", and a withdrawal simply moves money from the
// Invested row to the Cash row without changing what you kept.
export default function MoneyFlowSection({
  selIncome, selSpend, selInvest, selCash, selKept,
  selMonths, investBreakdown, fmt,
}) {
  const keptPct    = selIncome > 0 ? Math.round((selKept / selIncome) * 100) : 0
  const months     = selMonths.length || 1
  const overspent  = selKept < 0
  const keptColor  = overspent ? '#ff5f5f' : keptPct >= 25 ? '#3de8a0' : keptPct >= 10 ? '#ffb347' : '#ff5f5f'

  const Row = ({ label, value, color, sub, sign = '', strong = false, indent = false }) => (
    <Box sx={{
      display: 'flex', alignItems: 'baseline', gap: '12px',
      padding: indent ? '7px 0 7px 18px' : '9px 0',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontSize: indent ? 12.5 : 13.5,
          fontWeight: strong ? 700 : 600,
          color: indent ? '#8891b8' : '#c8cfea',
          display: 'flex', alignItems: 'center', gap: '7px',
        }}>
          {indent && <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11, color: '#5a6080', mt: '2px' }}>{sub}</Typography>
        )}
      </Box>
      <Typography sx={{
        fontSize: strong ? 21 : indent ? 14 : 16,
        fontWeight: strong ? 800 : 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {sign}{fmt(Math.abs(value))}
      </Typography>
    </Box>
  )

  return (
    <Box sx={{
      background: '#14172a',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '18px 20px',
      mb: '18px',
    }}>
      <Row label="Earned" value={selIncome} color="#3de8a0" />

      <Row
        label="Spent"
        value={selSpend}
        color="#ff5f5f"
        sign="−"
        sub={months > 1 ? `avg ${fmt(Math.round(selSpend / months))}/mo` : null}
      />

      <Box sx={{ height: '1px', background: 'rgba(255,255,255,0.08)', my: '6px' }} />

      <Row
        label={overspent ? 'Overspent' : 'Kept'}
        value={selKept}
        color={keptColor}
        sign={overspent ? '−' : ''}
        strong
        sub={selIncome > 0
          ? (overspent
              ? `you spent more than you earned`
              : `${keptPct}% of what you earned`)
          : null}
      />

      {/* Where the kept money sits. Invested + Cash always equals Kept — shown
          even when overspent, since "overspent ₹10k but invested ₹30k" is the
          explanation for the shortfall, not noise to hide. */}
      {(selInvest !== 0 || selCash !== 0) && (
        <Box sx={{ mt: '4px' }}>
          <Row
            label="Invested"
            value={selInvest}
            color="#b97fff"
            indent
            sign={selInvest < 0 ? '−' : ''}
            sub={investBreakdown?.length
              ? investBreakdown.slice(0, 3).map(([name]) => name).join(' · ') +
                (investBreakdown.length > 3 ? ` +${investBreakdown.length - 3} more` : '')
              : null}
          />
          <Row
            label="Cash left"
            value={selCash}
            color={selCash < 0 ? '#ff5f5f' : '#5b7fff'}
            indent
            sign={selCash < 0 ? '−' : ''}
          />
        </Box>
      )}
    </Box>
  )
}
