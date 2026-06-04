import React, { useMemo } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip
} from '@mui/material'
import { useTopExpensesTableStyles } from './styles/Expenses.styles'

export default function TopExpensesTable({
  expenses,
  selMonths,
  catMap,
  selExpense,
  onCategoryClick,
  fmt,
  MONTHS
}) {
  const { classes } = useTopExpensesTableStyles()

  const tableData = useMemo(() => {
    const catGroups = {}
    expenses.filter(e => selMonths.includes(+e.month - 1)).forEach(e => {
      const catId = e.categoryId
      if (!catGroups[catId]) {
        catGroups[catId] = {
          catName: catMap[catId]?.name || catId,
          color: catMap[catId]?.color || '#6c8fff',
          total: 0,
          details: []
        }
      }
      catGroups[catId].total += (+e.amount || 0)
      catGroups[catId].details.push({
        name: e.itemName || 'Unnamed',
        month: MONTHS[+e.month - 1],
        amount: +e.amount || 0
      })
    })

    return Object.values(catGroups)
      .sort((a, b) => b.total - a.total)
      .slice(0, 12)
      .map(group => {
        const pct = selExpense > 0 ? (group.total / selExpense * 100).toFixed(1) : 0
        const sortedDetails = [...group.details].sort((a, b) => b.amount - a.amount)
        const topItemName = sortedDetails[0]?.name || 'Unnamed'
        const moreCount = new Set(sortedDetails.map(d => d.name)).size - 1

        return {
          ...group,
          pct,
          topItemName,
          moreCount
        }
      })
  }, [expenses, selMonths, catMap, selExpense, MONTHS])

  return (
    <Box className={classes.container}>
      <Typography variant="subtitle1" className={classes.title}>
        Top Expense Items
      </Typography>
      <Typography variant="body2" className={classes.subtitle}>
        All items for selected period · Click to see details
      </Typography>

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead className={classes.tableHead}>
            <TableRow>
              {['Item', 'Category', 'Total', 'Avg/Month', '% of Spend'].map(h => (
                <TableCell key={h} className={classes.headerCell}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" className={classes.emptyCell}>
                  No data available for this selection
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((group, i) => (
                <TableRow
                  key={i}
                  hover
                  onClick={() => onCategoryClick(group)}
                  className={classes.tableRow}
                >
                  {/* Top Item cell */}
                  <TableCell className={classes.itemCell}>
                    <Box className={classes.itemNameBox}>
                      <Typography variant="body2" className={classes.itemName}>
                        {group.topItemName}
                      </Typography>
                      {group.moreCount > 0 && (
                        <Chip
                          label={`+${group.moreCount} more`}
                          size="small"
                          className={classes.moreChip}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* Category Chip cell */}
                  <TableCell className={classes.categoryChipCell}>
                    <Chip
                      label={group.catName}
                      size="small"
                      className={classes.categoryChip}
                      style={{
                        backgroundColor: `${group.color}15`,
                        color: group.color,
                        border: `1px solid ${group.color}33`
                      }}
                    />
                  </TableCell>

                  {/* Total cell */}
                  <TableCell className={classes.totalCell}>
                    {fmt(group.total)}
                  </TableCell>

                  {/* Avg Month cell */}
                  <TableCell className={classes.avgCell}>
                    {fmt(group.total / selMonths.length)}
                  </TableCell>

                  {/* Percentage Spend Slider cell */}
                  <TableCell className={classes.progressCell}>
                    <Box className={classes.progressWrapper}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(+group.pct * 2, 100)}
                        className={classes.progress}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: group.color,
                            borderRadius: 3
                          }
                        }}
                      />
                      <Typography variant="body2" className={classes.pctText}>
                        {group.pct}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
