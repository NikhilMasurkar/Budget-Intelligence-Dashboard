import React from 'react'
import { Box, Typography } from '@mui/material'

export default function WealthCardsSection({
  selInvest,
  investRate,
  investBreakdown,
  selNetSav,
  selIncome,
  fmt,
  selMonths,
}) {
  const selTrueSav  = selNetSav + selInvest
  const totalRate   = selIncome > 0 ? (selTrueSav / selIncome * 100).toFixed(1) : '0.0'
  const cashRate    = selIncome > 0 ? (selNetSav  / selIncome * 100).toFixed(1) : '0.0'
  const rateColor   = parseFloat(totalRate) >= 25 ? '#5b7fff' : parseFloat(totalRate) >= 10 ? '#ffb347' : '#ff5f5f'

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '16px', mb: '18px' }}>

      {/* ── Card 1 — Investments & Savings ── */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1a1330 0%, #0f0d20 100%)',
        border: '1px solid rgba(185,127,255,0.22)',
        borderRadius: '14px',
        padding: '16px 18px',
        overflow: 'hidden',
      }}>
        {/* Left accent bar */}
        <Box sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(180deg, #b97fff, #7c3fe8)',
          borderRadius: '14px 0 0 14px',
        }} />

        {/* Label */}
        <Typography sx={{
          fontSize: 11,
          fontWeight: 700,
          color: '#8891b8',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          mb: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: 14 }}>📈</span> Investments & Savings
        </Typography>

        {/* Value */}
        <Typography sx={{
          fontSize: 28,
          fontWeight: 800,
          color: '#b97fff',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          mb: '4px',
        }}>
          {fmt(selInvest)}
        </Typography>

        {/* Sub text */}
        <Typography sx={{ fontSize: 12, color: '#6a4a9a', mb: investBreakdown.length > 0 ? '12px' : 0 }}>
          {investRate}% of income invested
        </Typography>

        {/* Breakdown */}
        {investBreakdown.length > 0 && (
          <Box sx={{
            background: 'rgba(185,127,255,0.05)',
            border: '1px solid rgba(185,127,255,0.1)',
            borderRadius: '8px',
            padding: '10px 12px',
          }}>
            <Typography sx={{
              fontSize: 11,
              color: '#7a5aaa',
              fontWeight: 600,
              mb: '8px',
            }}>
              Avg {fmt(selInvest / selMonths.length)}/month
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {investBreakdown.map(([name, amount]) => {
                const isOut = amount < 0
                return (
                  <Box key={name} sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Typography sx={{ fontSize: 12, color: isOut ? '#c08a8a' : '#9a80c0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Box component="span" sx={{ color: isOut ? '#ff7a7a' : '#b97fff', fontSize: 14, lineHeight: 1 }}>
                        {isOut ? '↓' : '•'}
                      </Box>
                      {name}{isOut ? ' (withdrawal)' : ''}
                    </Typography>
                    <Typography sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isOut ? '#ff7a7a' : '#b97fff',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fmt(amount)}
                    </Typography>
                  </Box>
                )
              })}

              {/* Net reconciliation — deposits − withdrawals = net invested */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: '4px',
                pt: '7px',
                borderTop: '1px solid rgba(185,127,255,0.18)',
              }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#b97fff' }}>
                  = Net invested
                </Typography>
                <Typography sx={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: selInvest < 0 ? '#ff7a7a' : '#b97fff',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {fmt(selInvest)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Card 2 — Savings Rate breakdown ── */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0d1322 0%, #090d18 100%)',
        border: `1px solid ${rateColor}38`,
        borderRadius: '14px',
        padding: '16px 18px',
        overflow: 'hidden',
      }}>
        {/* Left accent bar */}
        <Box sx={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '3px',
          background: `linear-gradient(180deg, ${rateColor}, ${rateColor}88)`,
          borderRadius: '14px 0 0 14px',
        }} />

        {/* Label */}
        <Typography sx={{
          fontSize: 11, fontWeight: 700, color: '#8891b8',
          textTransform: 'uppercase', letterSpacing: '0.6px',
          mb: '8px', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: 14 }}>💰</span> Savings Rate
        </Typography>

        {/* Total value */}
        <Typography sx={{
          fontSize: 28, fontWeight: 800, color: rateColor,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px',
          lineHeight: 1.1, mb: '2px',
        }}>
          {fmt(selTrueSav)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: `${rateColor}99`, mb: '12px' }}>
          {totalRate}% of income goes toward wealth
        </Typography>

        {/* Calculation breakdown */}
        <Box sx={{
          background: `${rateColor}08`,
          border: `1px solid ${rateColor}18`,
          borderRadius: '8px',
          padding: '10px 12px',
        }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#3a4060', letterSpacing: '0.5px', textTransform: 'uppercase', mb: '8px' }}>
            How it's calculated
          </Typography>

          {/* Row: Invested */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '5px' }}>
            <Typography sx={{ fontSize: 12, color: '#b97fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Box component="span" sx={{ fontSize: 10 }}>📈</Box> Invested
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 11, color: '#6a4a9a', fontVariantNumeric: 'tabular-nums' }}>{investRate}%</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#b97fff', fontVariantNumeric: 'tabular-nums' }}>{fmt(selInvest)}</Typography>
            </Box>
          </Box>

          {/* Row: Cash left */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '8px' }}>
            <Typography sx={{ fontSize: 12, color: '#3de8a0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Box component="span" sx={{ fontSize: 10 }}>🏦</Box> Cash left
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 11, color: '#2a6a4e', fontVariantNumeric: 'tabular-nums' }}>{cashRate}%</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#3de8a0', fontVariantNumeric: 'tabular-nums' }}>{fmt(selNetSav)}</Typography>
            </Box>
          </Box>

          {/* Divider + Total */}
          <Box sx={{ borderTop: `1px solid ${rateColor}20`, pt: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: rateColor }}>
              = Total saved
            </Typography>
            <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Typography sx={{ fontSize: 11, color: `${rateColor}88`, fontVariantNumeric: 'tabular-nums' }}>{totalRate}%</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 800, color: rateColor, fontVariantNumeric: 'tabular-nums' }}>{fmt(selTrueSav)}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  )
}
