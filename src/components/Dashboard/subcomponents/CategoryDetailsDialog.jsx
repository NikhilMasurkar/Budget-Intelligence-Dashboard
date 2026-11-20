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
import { useStyles, useCategoryDetailsDialogUi } from '../styles/CategoryDetailsDialog.styles'
import { useColorStyles } from '../../../styles/colorStyles'

export default function CategoryDetailsDialog({ detailModal, onClose, selMonths, fmt, MONTHS }) {
  const { classes: ui, cx } = useCategoryDetailsDialogUi()
  const { classes } = useStyles()
  const { classes: tint } = useColorStyles(detailModal?.color)

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
              className={cx(classes.categoryLabel, tint.text)}
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
              className={cx(classes.bannerValueTotal, tint.text)}
            >
              {fmt(detailModal.total)}
            </Typography>
          </Box>
          <Box className={ui.totalBox}>
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
              <TableRow className={ui.itemRow}>
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
                          className={cx(classes.valueCell, val < 0 ? ui.valueNegative : val > 0 ? ui.valuePositive : ui.valueZero)}
                        >
                          {val !== 0 ? fmt(val) : '—'}
                        </TableCell>
                      )
                    })}

                    {/* Month Total value */}
                    <TableCell
                      align="right"
                      className={cx(classes.monthTotalCell, tint.text)}
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
