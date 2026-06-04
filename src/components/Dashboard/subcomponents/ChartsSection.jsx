import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { useStyles } from '../styles/ChartsSection.styles'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

export default function ChartsSection({
  filteredLabels,
  monthlyData,
  selMonths,
  catTotals,
  catColors,
  isMobile,
  expenses,
  catMap,
  fmt,
  fmtK,
  CHART_OPTS
}) {
  const { classes } = useStyles()

  // Per-category monthly data for stacked chart
  const stackedDatasets = useMemo(() => {
    const catMonthly = {}
    expenses.forEach(e => {
      const m = +e.month - 1
      if (!selMonths.includes(m)) return
      const catName = catMap[e.categoryId]?.name || 'Other'
      const color = catMap[e.categoryId]?.color || '#6c8fff'
      if (!catMonthly[catName]) catMonthly[catName] = { data: Array(12).fill(0), color }
      catMonthly[catName].data[m] += +e.amount || 0
    })

    return Object.entries(catMonthly).map(([name, { data, color }]) => ({
      label: name,
      data: selMonths.map(i => data[i]),
      backgroundColor: color + 'cc',
      borderColor: color,
      borderWidth: 0,
      borderRadius: 2,
      stack: 'categories'
    }))
  }, [expenses, selMonths, catMap])

  return (
    <Box>
      {/* Charts Row 1 */}
      <Box className={classes.chartGrid}>
        {/* Income vs Expenses Bar/Line Chart */}
        <Box className={classes.chartCard}>
          <Typography variant="subtitle1" className={classes.chartTitle}>
            Income vs Expenses — Monthly Trend
          </Typography>
          <Typography variant="body2" className={classes.chartSubtitle}>
            Compare monthly cash flow throughout the year
          </Typography>
          <Box className={classes.chartContainer260}>
            <Bar
              data={{
                labels: filteredLabels,
                datasets: [
                  {
                    type: 'bar',
                    label: 'Income',
                    data: selMonths.map(i => monthlyData.inc[i]),
                    backgroundColor: 'rgba(91,127,255,0.75)',
                    borderRadius: 4,
                    order: 2
                  },
                  {
                    type: 'bar',
                    label: 'Expenses',
                    data: selMonths.map(i => monthlyData.exp[i]),
                    backgroundColor: 'rgba(255,95,95,0.75)',
                    borderRadius: 4,
                    order: 2
                  },
                  {
                    type: 'line',
                    label: 'Net Savings',
                    data: selMonths.map(i => monthlyData.sav[i]),
                    borderColor: '#3de8a0',
                    backgroundColor: 'rgba(61,232,160,0.10)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#3de8a0',
                    pointBorderColor: '#13151f',
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
                      color: '#8891b8',
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
            Share of total spend
          </Typography>
          <Box className={classes.chartContainer260}>
            <Doughnut
              data={{
                labels: catTotals.map(([k]) => k),
                datasets: [{
                  data: catTotals.map(([, v]) => v),
                  backgroundColor: catColors,
                  borderWidth: 2,
                  borderColor: '#13151f'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: isMobile ? 'bottom' : 'right',
                    labels: { color: '#8891b8', font: { size: 11 }, boxWidth: 10 }
                  },
                  tooltip: { callbacks: { label: c => `${c.label}: ${fmt(c.raw)}` } }
                }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Stacked Category Monthly Breakdown */}
      <Box className={classes.stackedCard}>
        <Typography variant="subtitle1" className={classes.chartTitle}>
          Monthly Expense Breakdown by Category
        </Typography>
        <Typography variant="body2" className={classes.chartSubtitle}>
          Stacked view of each category's contribution per month
        </Typography>
        <Box className={classes.chartContainer300}>
          <Bar
            data={{ labels: filteredLabels, datasets: stackedDatasets }}
            options={{
              ...CHART_OPTS,
              scales: {
                ...CHART_OPTS.scales,
                x: { ...CHART_OPTS.scales.x, stacked: true },
                y: { ...CHART_OPTS.scales.y, stacked: true }
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top',
                  align: 'start',
                  labels: { color: '#8891b8', boxWidth: 12, font: { size: 11 }, padding: 14 }
                },
                tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtK(c.raw)}` } }
              }
            }}
          />
        </Box>
      </Box>

      {/* Charts Row 2 — Savings & Ratio */}
      <Box className={classes.chartGrid}>
        {/* Net Savings Bar Chart */}
        <Box className={classes.chartCard}>
          <Typography variant="subtitle1" className={classes.chartTitle}>
            Monthly Net Savings (Cash Short/Extra)
          </Typography>
          <Typography variant="body2" className={classes.chartSubtitle}>
            Positive = surplus, Negative = deficit
          </Typography>
          <Box className={classes.chartContainer220}>
            <Bar
              data={{
                labels: filteredLabels,
                datasets: [{
                  label: 'Net Savings',
                  data: selMonths.map(i => monthlyData.sav[i]),
                  backgroundColor: selMonths.map(i => monthlyData.sav[i] >= 0 ? 'rgba(61,232,160,0.75)' : 'rgba(255,95,95,0.75)'),
                  borderRadius: 4
                }]
              }}
              options={CHART_OPTS}
            />
          </Box>
        </Box>

        {/* Expense Ratio Line Chart */}
        <Box className={classes.chartCard}>
          <Typography variant="subtitle1" className={classes.chartTitle}>
            Expense Ratio to Income
          </Typography>
          <Typography variant="body2" className={classes.chartSubtitle}>
            % of income spent each month
          </Typography>
          <Box className={classes.chartContainer220}>
            <Line
              data={{
                labels: filteredLabels,
                datasets: [{
                  label: 'Expense %',
                  data: selMonths.map(i => monthlyData.inc[i] > 0
                    ? +((monthlyData.exp[i] / monthlyData.inc[i]) * 100).toFixed(1)
                    : 0),
                  borderColor: '#ffb347',
                  backgroundColor: 'rgba(255,179,71,0.12)',
                  borderWidth: 2.5,
                  pointRadius: 4,
                  pointBackgroundColor: '#ffb347',
                  pointBorderColor: '#13151f',
                  pointBorderWidth: 2,
                  tension: 0.35,
                  fill: true
                }]
              }}
              options={{
                ...CHART_OPTS,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: c => `Expense ratio: ${c.raw}%` } }
                },
                scales: {
                  x: { ...CHART_OPTS.scales.x },
                  y: {
                    ...CHART_OPTS.scales.y,
                    min: 0,
                    ticks: {
                      ...CHART_OPTS.scales.y.ticks,
                      callback: v => `${v}%`
                    }
                  }
                }
              }}
            />
          </Box>
          <Typography variant="caption" className={classes.captionRight}>
            Dashed line at 100% = spending equals income
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
