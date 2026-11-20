import { Suspense } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useStyles } from './App.styles'
import { YearBanner } from './StatusBanner'
import Loading from './Loading'
import { Dashboard } from './lazy'

export default function DashboardView({ app }) {
  const { classes, cx } = useStyles()
  const { year, setYear, availableYears } = app
  return (
    <>
      <YearBanner year={year} />
      <Box className={classes.headerRow}>
        <Typography variant="h5" className={classes.titleText}>Dashboard</Typography>
        <Box className={classes.yearTabsContainer}>
          {availableYears.map(y => (
            <Button key={y} onClick={() => setYear(y)} size="small"
              className={cx(classes.yearTabButton, year === y && classes.yearTabActiveButton)}>
              {y}
            </Button>
          ))}
        </Box>
      </Box>
      <Suspense fallback={<Loading />}>
        <Dashboard
          expenses={app.yearExpenses}
          income={app.yearIncome}
          // Full history: investment balances carry forward, so a pot's
          // true balance is not derivable from one year alone.
          allExpenses={app.expenses}
          categories={app.categories}
          year={year}
          month={app.month}
          selMonths={app.selMonths}
          setSelMonths={app.setSelMonths}
          onEditCategory={row => app.openModal('category', row)}
        />
      </Suspense>
    </>
  )
}
