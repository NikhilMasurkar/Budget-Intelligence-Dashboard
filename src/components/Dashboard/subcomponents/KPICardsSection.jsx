import React from 'react'
import { Box, Typography } from '@mui/material'
import { useStyles } from '../styles/KPICardsSection.styles'

export default function KPICardsSection({ selIncome, selExpense, selNetSav, selMonths, catTotals, expRate, savRate, fmt }) {
  const { classes } = useStyles()

  const cards = [
    { label: 'Total Income',    value: fmt(selIncome),  sub: `${selMonths.length} month${selMonths.length > 1 ? 's' : ''}`, color: '#5b7fff', icon: '💵' },
    { label: 'Total Expenses',  value: fmt(selExpense), sub: `${expRate}% of income`,     color: '#ff5f5f', icon: '💸' },
    { label: 'Net Savings',     value: fmt(selNetSav),  sub: `${savRate}% savings rate`,  color: selNetSav >= 0 ? '#3de8a0' : '#ff5f5f', icon: '🏦' },
    { label: 'Avg Monthly Exp', value: fmt(selExpense / selMonths.length), sub: 'per month', color: '#ffb347', icon: '📊' },
    { label: 'Top Category',    value: catTotals[0]?.[0] || '—', sub: catTotals[0] ? fmt(catTotals[0][1]) : '', color: '#b97fff', icon: '🏷️' },
  ]

  return (
    <Box className={classes.container}>
      {cards.map((k, i) => (
        <Box key={i} className={classes.card}>
          {/* Top Border Color Accent */}
          <Box
            className={classes.accentBar}
            style={{
              backgroundColor: k.color
            }}
          />
          <Typography variant="caption" className={classes.label}>
            {k.icon} {k.label}
          </Typography>
          <Typography
            variant="h6"
            className={classes.value}
            style={{
              color: k.color
            }}
          >
            {k.value}
          </Typography>
          <Typography variant="body2" className={classes.subText}>
            {k.sub}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
