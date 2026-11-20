import { Box, Typography } from '@mui/material'
import { isYearLocked, inLockGrace } from '../../utils/constants'
import { useStyles } from './App.styles'

export function Banner({ icon, children, role }) {
  const { classes } = useStyles()
  return (
    <Box className={classes.lockedBanner} role={role}>
      <span className={classes.bannerIcon}>{icon}</span>
      <Typography variant="body2" className={classes.bannerText}>{children}</Typography>
    </Box>
  )
}

// Closed-year notice (read-only) or the January grace notice for last year.
export function YearBanner({ year }) {
  if (isYearLocked(year)) {
    return <Banner icon="🔒"><strong>Historical Archive:</strong> Year {year} is locked. Data is preserved as read-only.</Banner>
  }
  if (inLockGrace(year)) {
    return <Banner icon="⏳">Year {year} is still editable until 31 Jan for late entries, then it locks.</Banner>
  }
  return null
}

export function OfflineBanner() {
  return (
    <Banner icon="📴" role="status">
      <strong>Offline</strong> — everything still works. Changes are saved on this phone and sync by themselves when you're back online.
    </Banner>
  )
}
