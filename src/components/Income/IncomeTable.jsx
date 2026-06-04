import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { useIncomeTableStyles } from './styles/Income.styles'
import { fmt } from '../../utils/constants'

export default function IncomeTable({ income, onEdit, onDelete, canEdit }) {
  const { classes } = useIncomeTableStyles()
  const total = income.reduce((s, i) => s + (+i.amount || 0), 0)

  return (
    <Box className={classes.container}>
      {/* Table Summary Header */}
      <Box className={classes.headerRow}>
        <Typography variant="body2" className={classes.headerText}>
          {income.length} {income.length === 1 ? 'entry' : 'entries'} · Total: <Box component="span" style={{ color: '#e4e8f5', fontWeight: 700 }}>{fmt(total)}</Box>
        </Typography>
      </Box>

      {/* Main Table Container */}
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table sx={{ minWidth: 500 }} aria-label="income table">
          <TableHead className={classes.tableHead}>
            <TableRow>
              <TableCell className={classes.headerCell}>
                Source
              </TableCell>
              <TableCell align="right" className={classes.headerCell}>
                Amount
              </TableCell>
              {canEdit && (
                <TableCell align="right" className={classes.headerCell} style={{ width: '120px' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {income.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 3 : 2} align="center" className={classes.emptyCell}>
                  <Typography variant="body2" className={classes.emptyText}>
                    No income entries. Add one!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              income.map(i => (
                <TableRow key={i.id} className={classes.tableRow}>
                  <TableCell className={classes.sourceCell}>
                    {i.source}
                  </TableCell>
                  <TableCell align="right" className={classes.amountCell}>
                    {fmt(i.amount)}
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right" className={classes.actionsCell}>
                      <Box className={classes.actionsContainer}>
                        <Tooltip title="Edit Source" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(i)}
                            className={classes.actionButton}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Source" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(i)}
                            className={classes.deleteButton}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
