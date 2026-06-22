import React from 'react'
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useStyles } from '../styles/CategoryDetailsDialog.styles'

export default function CategoryDetailsDialog({ detailModal, onClose, selMonths, fmt, MONTHS }) {
  const { classes } = useStyles()

  if (!detailModal) return null

  const uniqueItems = Array.from(new Set(detailModal.details.map(d => d.name))).sort()
  const monthsInPivot = Array.from(new Set(detailModal.details.map(d => d.month)))
    .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b))

  const data = {}
  monthsInPivot.forEach(m => {
    data[m] = {}
  })
  detailModal.details.forEach(d => {
    data[d.month][d.name] = (data[d.month][d.name] || 0) + d.amount
  })

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={classes.dialog}
    >
      <Box className={classes.content}>
        {/* Header */}
        <Box className={classes.header}>
          <Box>
            <Typography
              variant="caption"
              className={classes.categoryLabel}
              style={{ color: detailModal.color }}
            >
              Category Details
            </Typography>
            <Typography variant="h5" className={classes.categoryName}>
              {detailModal.catName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" className={classes.closeButton}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Total info banner */}
        <Box className={classes.infoBanner}>
          <Box>
            <Typography variant="caption" className={classes.bannerLabel}>
              Total Expenditure
            </Typography>
            <Typography
              variant="h6"
              className={classes.bannerValueTotal}
              style={{ color: detailModal.color }}
            >
              {fmt(detailModal.total)}
            </Typography>
          </Box>
          <Box style={{ textAlign: 'right' }}>
            <Typography variant="caption" className={classes.bannerLabel}>
              Period
            </Typography>
            <Typography variant="body2" className={classes.bannerValuePeriod}>
              {selMonths.length} Months
            </Typography>
          </Box>
        </Box>

        {/* Pivot table container */}
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table stickyHeader size="small" className={classes.table}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.08)' } }}>
                <TableCell className={classes.thCell}>
                  Month
                </TableCell>
                {uniqueItems.map(name => (
                  <TableCell
                    key={name}
                    align="right"
                    className={classes.thCellRight}
                  >
                    {name}
                  </TableCell>
                ))}
                <TableCell align="right" className={classes.thCellTotal}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthsInPivot.map(m => {
                let monthTotal = 0
                return (
                  <TableRow key={m} className={classes.tableRow}>
                    {/* Month Cell */}
                    <TableCell className={classes.monthCell}>
                      {m}
                    </TableCell>

                    {/* Unique Items values */}
                    {uniqueItems.map(name => {
                      const val = data[m][name] || 0
                      monthTotal += val
                      return (
                        <TableCell
                          key={name}
                          align="right"
                          className={classes.valueCell}
                          style={{
                            color: val < 0 ? '#ff7a7a' : val > 0 ? '#e4e8f5' : '#8891b8'
                          }}
                        >
                          {val !== 0 ? fmt(val) : '—'}
                        </TableCell>
                      )
                    })}

                    {/* Month Total value */}
                    <TableCell
                      align="right"
                      className={classes.monthTotalCell}
                      style={{ color: detailModal.color }}
                    >
                      {fmt(monthTotal)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Dialog>
  )
}
