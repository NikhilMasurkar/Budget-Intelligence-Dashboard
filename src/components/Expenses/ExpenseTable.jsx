import React, { useState } from 'react'
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
  Tooltip,
  Checkbox,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { useExpenseTableStyles } from './styles/Expenses.styles'
import { fmt } from '../../utils/constants'

export default function ExpenseTable({
  expenses,
  categories,
  onEdit,
  onDelete,
  canEdit,
  selectedIds = [],
  onSelectionChange
}) {
  const { classes, cx } = useExpenseTableStyles()
  const [search, setSearch] = useState('')
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const catOrder = new Map(categories.map((c, i) => [c.id, i]))

  const filtered = expenses.filter(e =>
    e.itemName?.toLowerCase().includes(search.toLowerCase()) ||
    catMap[e.categoryId]?.name?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const orderA = catOrder.has(a.categoryId) ? catOrder.get(a.categoryId) : 999
    const orderB = catOrder.has(b.categoryId) ? catOrder.get(b.categoryId) : 999
    return orderA - orderB
  })

  const total = filtered.reduce((s, e) => s + (+e.amount || 0), 0)

  const handleSelectAllToggle = (ev) => {
    if (ev.target.checked) {
      const filteredIds = filtered.map(e => e.id)
      onSelectionChange(Array.from(new Set([...selectedIds, ...filteredIds])))
    } else {
      const filteredIdsSet = new Set(filtered.map(e => e.id))
      onSelectionChange(selectedIds.filter(id => !filteredIdsSet.has(id)))
    }
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selectedIds.includes(e.id))
  const someFilteredSelected = filtered.length > 0 && filtered.some(e => selectedIds.includes(e.id))

  return (
    <Box className={classes.container}>
      <Box className={classes.filterRow}>
        <TextField
          size="small"
          placeholder="Search expenses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          className={classes.searchField}
        />
        <Typography variant="body2" className={classes.totalText}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'} · Total: <Box component="span" style={{ color: '#e4e8f5', fontWeight: 700 }}>{fmt(total)}</Box>
        </Typography>
      </Box>

      {/* Main Table Container */}
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table sx={{ minWidth: 600 }} aria-label="expenses table">
          <TableHead className={classes.tableHead}>
            <TableRow>
              {canEdit && (
                <TableCell className={classes.thCheckboxCell}>
                  <Checkbox
                    size="small"
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected && !allFilteredSelected}
                    onChange={handleSelectAllToggle}
                    className={classes.checkbox}
                    inputProps={{ 'aria-label': 'Select all expenses' }}
                  />
                </TableCell>
              )}
              <TableCell className={classes.headerCell}>
                Item Name
              </TableCell>
              <TableCell className={classes.headerCell}>
                Category
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 3} align="center" className={classes.emptyCell}>
                  <Typography variant="body2" className={classes.emptyText}>
                    No expenses this month. Add one!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(e => {
                const cat = catMap[e.categoryId]
                const isSelected = selectedIds.includes(e.id)
                return (
                  <TableRow
                    key={e.id}
                    className={classes.tableRow}
                    style={{
                      backgroundColor: isSelected ? 'rgba(91, 127, 255, 0.04)' : 'transparent'
                    }}
                  >
                    {canEdit && (
                      <TableCell className={classes.tdCheckboxCell}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={(ev) => {
                            if (ev.target.checked) {
                              onSelectionChange([...selectedIds, e.id])
                            } else {
                              onSelectionChange(selectedIds.filter(id => id !== e.id))
                            }
                          }}
                          className={classes.rowCheckbox}
                        />
                      </TableCell>
                    )}
                    <TableCell className={classes.itemNameCell}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Typography variant="subtitle2" className={classes.itemName}>
                          {e.itemName}
                        </Typography>
                        {e.isFixed === 'TRUE' && (
                          <Box component="span" sx={{
                            fontSize: 10, background: 'rgba(91,127,255,0.15)',
                            color: '#a0b4ff', border: '1px solid rgba(91,127,255,0.3)',
                            borderRadius: '4px', padding: '1px 5px', fontWeight: 600,
                            letterSpacing: '0.3px', lineHeight: 1.6, flexShrink: 0
                          }}>
                            📌
                          </Box>
                        )}
                      </Box>
                      {e.note && (
                        <Typography variant="caption" className={classes.itemNote}>
                          💬 {e.note}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className={classes.categoryCell}>
                      {cat ? (
                        <Chip
                          label={cat.name}
                          size="small"
                          className={classes.categoryChip}
                          style={{
                            backgroundColor: `${cat.color || '#6c8fff'}18`,
                            color: cat.color || '#6c8fff',
                            border: `1px solid ${cat.color || '#6c8fff'}33`
                          }}
                        />
                      ) : (
                        <Typography variant="body2" className={classes.categoryFallbackText}>
                          {e.categoryId || '—'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" className={classes.amountCell}>
                      {fmt(e.amount)}
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right" className={classes.actionsCell}>
                        <Box className={classes.actionsContainer}>
                          <Tooltip title="Edit Expense" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onEdit(e)}
                              className={classes.actionButton}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Expense" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(e)}
                              className={classes.deleteButton}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
