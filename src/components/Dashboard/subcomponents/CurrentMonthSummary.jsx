import React from 'react'
import { Box, Typography } from '@mui/material'
import { useStyles } from '../styles/CurrentMonthSummary.styles'

export default function CurrentMonthSummary({ displayMonthName, year, curMonthInc, curMonthExp, curMonthSav, fmt }) {
  const { classes, cx } = useStyles()

  return (
    <Box className={classes.container}>
      {/* Summary Header */}
      <Box className={classes.header}>
        <Typography variant="body2" className={classes.headerText}>
          <span>📅</span>
          <span>{displayMonthName} {year} Summary (Current Month)</span>
        </Typography>
      </Box>

      {/* Summary Cards Grid */}
      <Box className={classes.grid}>
        {/* Income Card */}
        <Box className={cx(classes.card, classes.cardIncome)}>
          <Typography variant="caption" className={classes.cardLabel}>
            Total Income
          </Typography>
          <Typography variant="h6" className={cx(classes.cardValue, classes.valueIncome)}>
            {fmt(curMonthInc)}
          </Typography>
        </Box>

        {/* Expenses Card */}
        <Box className={cx(classes.card, classes.cardExpenses)}>
          <Typography variant="caption" className={classes.cardLabel}>
            Total Expenses
          </Typography>
          <Typography variant="h6" className={cx(classes.cardValue, classes.valueExpenses)}>
            {fmt(curMonthExp)}
          </Typography>
        </Box>

        {/* Savings Card */}
        <Box
          className={classes.card}
          style={{
            borderLeft: `3px solid ${curMonthSav >= 0 ? '#3de8a0' : '#ff5f5f'}`
          }}
        >
          <Typography variant="caption" className={classes.cardLabel}>
            Net Savings
          </Typography>
          <Typography
            variant="h6"
            className={classes.cardValue}
            style={{
              color: curMonthSav >= 0 ? '#3de8a0' : '#ff5f5f'
            }}
          >
            {fmt(curMonthSav)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
