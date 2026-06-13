import React from 'react'
import { Box, Typography } from '@mui/material'

export default function CurrentMonthSummary({ displayMonthName, year, curMonthInc, curMonthExp, curMonthSav, fmt }) {
  const savColor = curMonthSav >= 0 ? '#3de8a0' : '#ff5f5f'

  const items = [
    { label: 'TOTAL INCOME',   value: fmt(curMonthInc), color: '#5b7fff' },
    { label: 'TOTAL EXPENSES', value: fmt(curMonthExp), color: '#ff5f5f' },
    { label: 'NET SAVINGS',    value: fmt(curMonthSav), color: savColor   },
  ]

  return (
    <Box sx={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: { xs: '12px 14px', sm: '14px 20px' },
      mb: '14px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: { xs: '10px 16px', sm: '0px' },
    }}>
      {/* Month badge */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '4px 12px',
        mr: { xs: 0, sm: '20px' },
        flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: 13, lineHeight: 1 }}>📅</Typography>
        <Typography sx={{
          fontSize: 12,
          fontWeight: 700,
          color: '#8891b8',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
        }}>
          {displayMonthName} {year}
        </Typography>
      </Box>

      {/* Stat items */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        flex: 1,
        gap: { xs: '10px 20px', sm: 0 },
      }}>
        {items.map((item, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: '8px', sm: 0 },
            }}
          >
            {/* Separator — only on sm+ between items */}
            {i > 0 && (
              <Box sx={{
                display: { xs: 'none', sm: 'block' },
                width: '1px',
                height: '28px',
                background: 'rgba(255,255,255,0.08)',
                mx: '20px',
                flexShrink: 0,
              }} />
            )}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: { xs: '6px', sm: '2px' } }}>
              <Typography sx={{
                fontSize: 10,
                fontWeight: 700,
                color: '#56607a',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
              </Typography>
              <Typography sx={{
                fontSize: { xs: 14, sm: 16 },
                fontWeight: 800,
                color: item.color,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}>
                {item.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
