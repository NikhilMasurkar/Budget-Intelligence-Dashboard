import { Box, Typography } from '@mui/material'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, LineController, BarController, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { useStyles } from '../styles/ChartsSection.styles'
import { tokens, rgba, useThemeMode } from '../../../theme/tokens'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, LineController, BarController, PointElement, ArcElement, Tooltip, Legend, Filler)

export default function ChartsSection({
  filteredLabels,
  monthlyData,
  selMonths,
  catTotals,
  catColors,
  isMobile,
  fmt,
  fmtK,
  CHART_OPTS
}) {
  useThemeMode() // re-render so chart/score colours follow the theme
  const { classes } = useStyles()

  return (
    <Box>
      {/* Charts Row 1 */}
      <Box className={classes.chartGrid}>
        {/* Income vs Expenses Bar/Line Chart */}
        <Box className={classes.chartCard}>
          <Typography variant="subtitle1" className={classes.chartTitle}>
            Earned vs Spent — Monthly Trend
          </Typography>
          <Typography variant="body2" className={classes.chartSubtitle}>
            Spending only — money moved into investments is not counted here
          </Typography>
          <Box className={classes.chartContainer260}>
            <Bar
              data={{
                labels: filteredLabels,
                datasets: [
                  {
                    type: 'bar',
                    label: 'Earned',
                    data: selMonths.map(i => monthlyData.inc[i]),
                    backgroundColor: rgba(tokens.accent, 0.75),
                    borderRadius: 4,
                    order: 2
                  },
                  {
                    type: 'bar',
                    label: 'Spent',
                    data: selMonths.map(i => monthlyData.spend[i]),
                    backgroundColor: rgba(tokens.danger, 0.75),
                    borderRadius: 4,
                    order: 2
                  },
                  {
                    type: 'line',
                    label: 'Kept',
                    data: selMonths.map(i => monthlyData.kept[i]),
                    borderColor: tokens.accent2,
                    backgroundColor: rgba(tokens.accent2, 0.10),
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: tokens.accent2,
                    pointBorderColor: tokens.bg,
                    pointBorderWidth: 2,
                    tension: 0.35,
                    fill: false,
                    order: 1
                  }
                ]
              }}
              options={{
                ...CHART_OPTS,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'start',
                    labels: {
                      color: tokens.text2,
                      boxWidth: 12,
                      font: { size: 11 },
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: (ctx) => ctx.datasetIndex === 2 ? 'line' : 'rect'
                    }
                  },
                  tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtK(c.raw)}` } }
                }
              }}
            />
          </Box>
        </Box>

        {/* Category Breakdown Doughnut Chart */}
        <Box className={classes.chartCard}>
          <Typography variant="subtitle1" className={classes.chartTitle}>
            Category Breakdown
          </Typography>
          <Typography variant="body2" className={classes.chartSubtitle}>
            Where your spending went — investments excluded
          </Typography>
          <Box className={classes.chartContainer260}>
            <Doughnut
              data={{
                labels: catTotals.map(([k]) => k),
                datasets: [{
                  data: catTotals.map(([, v]) => v),
                  // Cycle the palette so every slice has a color even when there
                  // are more categories than palette entries (14 defaults > 10).
                  backgroundColor: catTotals.map((_, i) => catColors[i % catColors.length]),
                  borderWidth: 2,
                  borderColor: tokens.bg
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: { color: tokens.text2, font: { size: 11 }, boxWidth: 10 }
                  },
                  tooltip: { callbacks: { label: c => `${c.label}: ${fmt(c.raw)}` } }
                }
              }}
            />
          </Box>
        </Box>
      </Box>

    </Box>
  )
}
