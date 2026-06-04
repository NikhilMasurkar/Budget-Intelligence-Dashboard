import React from 'react'
import { Box, Typography } from '@mui/material'
import { useStyles } from '../styles/WealthCardsSection.styles'

export default function WealthCardsSection({
  selInvest,
  investRate,
  investBreakdown,
  selNetSav,
  savRate,
  selWealth,
  wealthRate,
  fmt,
  selMonths
}) {
  const { classes, cx } = useStyles()

  return (
    <Box className={classes.container}>
      {/* Investments Card */}
      <Box className={cx(classes.cardBase, classes.cardInvestments)}>
        <Box className={cx(classes.accentBar, classes.accentInvestments)} />
        <Typography variant="caption" className={classes.label}>
          📈 Investments & Savings
        </Typography>
        <Typography variant="h4" className={cx(classes.value, classes.valueInvestments)}>
          {fmt(selInvest)}
        </Typography>
        <Typography variant="body2" className={cx(classes.subText, classes.subTextInvestments)}>
          {investRate}% of income invested
        </Typography>

        {selInvest > 0 && (
          <Box className={classes.breakdownSection}>
            <Box
              className={classes.breakdownHeader}
              style={{ marginBottom: investBreakdown.length ? '8px' : 0 }}
            >
              Avg {fmt(selInvest / selMonths.length)}/month
            </Box>
            {investBreakdown.length > 0 && (
              <Box className={classes.breakdownContainer}>
                {investBreakdown.map(([name, amount]) => (
                  <Box key={name} className={classes.breakdownRow}>
                    <Box component="span" className={classes.breakdownBullet}>
                      • {name}
                    </Box>
                    <Box component="span" className={classes.breakdownAmount}>
                      {fmt(amount)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Cash Savings Card */}
      <Box
        className={classes.cardBase}
        style={{
          background: selNetSav >= 0 ? 'linear-gradient(135deg, #0d2318, #0a1a10)' : 'linear-gradient(135deg, #230d0d, #1a0a0a)',
          border: `1px solid ${selNetSav >= 0 ? 'rgba(61, 232, 160, 0.3)' : 'rgba(255, 95, 95, 0.3)'}`
        }}
      >
        <Box
          className={classes.accentBar}
          style={{
            background: selNetSav >= 0 ? 'linear-gradient(90deg, #3de8a0, #22c55e)' : 'linear-gradient(90deg, #ff5f5f, #e83d3d)'
          }}
        />
        <Typography variant="caption" className={classes.label}>
          🏦 Cash Savings
        </Typography>
        <Typography
          variant="h4"
          className={classes.value}
          style={{
            color: selNetSav >= 0 ? '#3de8a0' : '#ff5f5f'
          }}
        >
          {fmt(selNetSav)}
        </Typography>
        <Typography
          variant="body2"
          className={classes.subText}
          style={{
            color: selNetSav >= 0 ? '#4a8a6a' : '#8a4a4a'
          }}
        >
          {savRate}% of income remaining
        </Typography>
        {selNetSav !== 0 && (
          <Box className={classes.footerLabel}>
            After all expenses incl. investments
          </Box>
        )}
      </Box>

      {/* Wealth Built Card */}
      <Box className={cx(classes.cardBase, classes.cardWealth)}>
        <Box className={cx(classes.accentBar, classes.accentWealth)} />
        <Typography variant="caption" className={classes.label}>
          🚀 Total Wealth Built
        </Typography>
        <Typography variant="h4" className={cx(classes.value, classes.valueWealth)}>
          {fmt(selWealth)}
        </Typography>
        <Typography variant="body2" className={cx(classes.subText, classes.subTextWealth)}>
          {wealthRate}% wealth rate
        </Typography>
        <Box className={classes.footerSection}>
          <Box component="span" style={{ color: '#a78bfa' }}>
            📈 Inv: {fmt(selInvest)}
          </Box>
          <Box component="span" style={{ color: '#3de8a0' }}>
            🏦 Cash: {fmt(selNetSav)}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
