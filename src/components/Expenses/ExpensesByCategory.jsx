import React, { useState, useMemo } from 'react'
import {
  Box, Typography, Button, IconButton, Tooltip,
  Collapse, Menu, MenuItem, ListItemIcon, Divider,
  FormControl, Select
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { makeStyles } from 'tss-react/mui'
import { MONTHS, fmt } from '../../utils/constants'
import { useGlobalStyles } from '../../styles/globalStyles'

const useStyles = makeStyles()((theme) => ({
  headerRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '20px', flexWrap: 'wrap'
  },
  title: { fontWeight: 700, fontSize: '22px', color: theme.palette.text.primary },
  flexFiller: { flex: 1 },
  totalBar: {
    display: 'flex', gap: '12px', marginBottom: '16px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    flexWrap: 'wrap'
  },
  totalItem: { fontSize: 12, color: '#8891b8' },
  totalValue: { fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  // Category accordion section
  section: {
    marginBottom: '8px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
    transition: 'border-color 0.15s'
  },
  sectionExpanded: { borderColor: 'rgba(255,255,255,0.13)' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
    userSelect: 'none',
    background: '#181b28',
    '&:hover': { background: 'rgba(255,255,255,0.025)' },
    transition: 'background 0.15s'
  },
  sectionHeaderExpanded: { background: 'rgba(255,255,255,0.03)' },
  colorDot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0
  },
  catName: {
    fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.5px',
    textTransform: 'uppercase', color: '#c8cfea', flex: 1,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  catMeta: { fontSize: 12, color: '#8891b8', whiteSpace: 'nowrap' },
  catTotal: {
    fontSize: 14, fontWeight: 800, color: '#e4e8f5',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    marginLeft: '8px'
  },
  addBtn: {
    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
    borderRadius: '6px', whiteSpace: 'nowrap', minWidth: 0,
    borderColor: 'rgba(91,127,255,0.35)', color: '#a0b4ff',
    '&:hover': { borderColor: 'rgba(91,127,255,0.6)', background: 'rgba(91,127,255,0.07)' }
  },
  menuBtn: {
    color: '#8891b8', padding: '4px',
    '&:hover': { color: '#e4e8f5', background: 'rgba(255,255,255,0.05)' }
  },
  expandIcon: { color: '#8891b8', fontSize: '20px' },
  // Expense rows inside section
  expenseList: { background: '#101218' },
  expenseRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 16px 10px 36px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    '&:hover': { background: 'rgba(255,255,255,0.015)' },
    transition: 'background 0.12s'
  },
  expenseName: {
    flex: 1, fontWeight: 600, fontSize: '13px',
    color: '#e4e8f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  expenseNote: {
    fontSize: '11px', color: '#8891b8', fontStyle: 'italic',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: '180px'
  },
  fixedBadge: {
    fontSize: 9, background: 'rgba(91,127,255,0.15)',
    color: '#a0b4ff', border: '1px solid rgba(91,127,255,0.3)',
    borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
    letterSpacing: '0.3px', flexShrink: 0
  },
  expenseAmount: {
    fontWeight: 700, fontSize: '13px', color: '#e4e8f5',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'
  },
  rowAction: {
    color: '#8891b8', padding: '3px',
    '&:hover': { color: '#5b7fff', background: 'rgba(91,127,255,0.1)' }
  },
  rowDelete: {
    color: '#8891b8', padding: '3px',
    '&:hover': { color: '#ff5f5f', background: 'rgba(255,95,95,0.1)' }
  },
  emptyRow: {
    padding: '16px 16px 16px 36px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    color: '#8891b8', fontSize: '12px', fontStyle: 'italic'
  },
  menuPaper: {
    background: '#181b28', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderRadius: '10px',
    minWidth: '190px', padding: '4px'
  },
  menuItem: {
    borderRadius: '6px', fontSize: '13px', gap: '10px',
    padding: '7px 12px', color: '#c8cfea',
    '&:hover': { background: 'rgba(255,255,255,0.05)' }
  },
  menuItemDanger: {
    borderRadius: '6px', fontSize: '13px', gap: '10px',
    padding: '7px 12px', color: '#ff7070',
    '&:hover': { background: 'rgba(255,95,95,0.08)' }
  },
  menuIcon: { minWidth: '28px', color: 'inherit' }
}))

export default function ExpensesByCategory({
  expenses, categories, year, month, availableYears,
  onYearChange, onMonthChange,
  onAddExpense, onEditExpense, onDeleteExpense,
  onAddCategory, onEditCategory, onDeleteCategory,
  onReorderCategory, onCopyToNextMonth,
  canEdit
}) {
  const { classes, cx } = useStyles()
  const { classes: g } = useGlobalStyles()

  const [expanded, setExpanded] = useState(new Set())
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuCat, setMenuCat] = useState(null)

  const monthExps = useMemo(() =>
    expenses.filter(e => String(e.year) === String(year) && String(e.month) === String(month))
  , [expenses, year, month])

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c]))
  , [categories])

  // Totals for the summary bar
  const grandTotal = monthExps.reduce((s, e) => s + (+e.amount || 0), 0)
  const itemCount = monthExps.length

  const toggle = (catId) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(categories.map(c => c.id).concat('_uncategorized')))
  const collapseAll = () => setExpanded(new Set())

  const openMenu = (e, cat) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuCat(cat)
  }
  const closeMenu = () => { setMenuAnchor(null); setMenuCat(null) }

  const handleMoveUp = () => {
    const idx = categories.findIndex(c => c.id === menuCat.id)
    if (idx <= 0) { closeMenu(); return }
    const reordered = [...categories]
    ;[reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]]
    onReorderCategory(reordered)
    closeMenu()
  }

  const handleMoveDown = () => {
    const idx = categories.findIndex(c => c.id === menuCat.id)
    if (idx >= categories.length - 1) { closeMenu(); return }
    const reordered = [...categories]
    ;[reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]]
    onReorderCategory(reordered)
    closeMenu()
  }

  const handleCopyCat = () => {
    const catExps = monthExps.filter(e => e.categoryId === menuCat.id)
    if (catExps.length) onCopyToNextMonth(catExps.map(e => e.id))
    closeMenu()
  }

  // Expenses that don't match any known category
  const uncategorized = monthExps.filter(e => !catMap[e.categoryId])

  return (
    <Box>
      {/* ── Header ── */}
      <Box className={classes.headerRow}>
        <Typography variant="h5" className={classes.title}>Expenses</Typography>
        <FormControl size="small" className={g.nativeSelectFormControl}>
          <Select value={year} onChange={e => onYearChange(+e.target.value)} native className={g.nativeSelect}>
            {availableYears.map(y => <option key={y} value={y} style={{ background: '#181b28', color: '#e4e8f5' }}>{y}</option>)}
          </Select>
        </FormControl>
        <FormControl size="small" className={g.nativeSelectFormControl}>
          <Select value={month} onChange={e => onMonthChange(+e.target.value)} native className={g.nativeSelect}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1} style={{ background: '#181b28', color: '#e4e8f5' }}>{m}</option>)}
          </Select>
        </FormControl>
        <Box className={classes.flexFiller} />
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button size="small" variant="text"
            onClick={expanded.size > 0 ? collapseAll : expandAll}
            sx={{ fontSize: 12, color: '#8891b8', textTransform: 'none', minWidth: 0 }}>
            {expanded.size > 0 ? 'Collapse all' : 'Expand all'}
          </Button>
          {canEdit && (
            <>
              <Button size="small" variant="outlined" onClick={onAddCategory} className={classes.addBtn}>
                + Category
              </Button>
              <Button size="small" variant="contained" onClick={() => onAddExpense(null)} className={g.containedBlueButton}>
                + Add Expense
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ── Summary bar ── */}
      {itemCount > 0 && (
        <Box className={classes.totalBar}>
          <Typography className={classes.totalItem}>
            {MONTHS[month - 1]} {year} &nbsp;·&nbsp;
            <Box component="span" className={classes.totalValue} sx={{ color: '#ff7a7a' }}>
              {fmt(grandTotal)}
            </Box>
            &nbsp;spent &nbsp;·&nbsp; {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* ── Category Sections ── */}
      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: '#8891b8', fontSize: 14 }}>
          No categories yet. Click "+ Category" to add one.
        </Box>
      )}

      {categories.map((cat, idx) => {
        const catExps = monthExps.filter(e => e.categoryId === cat.id)
        const catTotal = catExps.reduce((s, e) => s + (+e.amount || 0), 0)
        const isOpen = expanded.has(cat.id)

        return (
          <Box key={cat.id} className={cx(classes.section, isOpen && classes.sectionExpanded)}>
            {/* Section Header */}
            <Box
              className={cx(classes.sectionHeader, isOpen && classes.sectionHeaderExpanded)}
              onClick={() => toggle(cat.id)}
            >
              {isOpen
                ? <ExpandLessIcon className={classes.expandIcon} />
                : <ExpandMoreIcon className={classes.expandIcon} />
              }
              <Box className={classes.colorDot} style={{ background: cat.color || '#5b7fff' }} />
              <Typography className={classes.catName}>{cat.name}</Typography>
              {catExps.length > 0 && (
                <Typography className={classes.catMeta}>{catExps.length} item{catExps.length !== 1 ? 's' : ''}</Typography>
              )}
              <Typography className={classes.catTotal} style={{ color: catTotal > 0 ? '#e4e8f5' : '#5a6080' }}>
                {catTotal > 0 ? fmt(catTotal) : '—'}
              </Typography>

              {canEdit && (
                <Button
                  size="small" variant="outlined"
                  className={classes.addBtn}
                  onClick={e => { e.stopPropagation(); onAddExpense(cat.id) }}
                >
                  + Add
                </Button>
              )}

              <IconButton size="small" className={classes.menuBtn} onClick={e => openMenu(e, cat)}>
                <MoreVertIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* Expense rows */}
            <Collapse in={isOpen} timeout={150}>
              <Box className={classes.expenseList}>
                {catExps.length === 0 ? (
                  <Box className={classes.emptyRow}>No expenses this month</Box>
                ) : (
                  catExps.map(exp => (
                    <Box key={exp.id} className={classes.expenseRow}>
                      <Typography className={classes.expenseName}>{exp.itemName}</Typography>
                      {exp.note && (
                        <Typography className={classes.expenseNote}>💬 {exp.note}</Typography>
                      )}
                      {exp.isFixed === 'TRUE' && (
                        <Box component="span" className={classes.fixedBadge}>📌</Box>
                      )}
                      <Typography className={classes.expenseAmount}>{fmt(exp.amount)}</Typography>
                      {canEdit && (
                        <>
                          <Tooltip title="Edit" arrow>
                            <IconButton size="small" className={classes.rowAction}
                              onClick={() => onEditExpense(exp)}>
                              <EditOutlinedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete" arrow>
                            <IconButton size="small" className={classes.rowDelete}
                              onClick={() => onDeleteExpense(exp)}>
                              <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Collapse>
          </Box>
        )
      })}

      {/* Uncategorized section */}
      {uncategorized.length > 0 && (
        <Box className={cx(classes.section, expanded.has('_uncategorized') && classes.sectionExpanded)}>
          <Box
            className={cx(classes.sectionHeader, expanded.has('_uncategorized') && classes.sectionHeaderExpanded)}
            onClick={() => toggle('_uncategorized')}
          >
            {expanded.has('_uncategorized')
              ? <ExpandLessIcon className={classes.expandIcon} />
              : <ExpandMoreIcon className={classes.expandIcon} />
            }
            <Box className={classes.colorDot} style={{ background: '#8891b8' }} />
            <Typography className={classes.catName}>Uncategorized</Typography>
            <Typography className={classes.catMeta}>{uncategorized.length} item{uncategorized.length !== 1 ? 's' : ''}</Typography>
            <Typography className={classes.catTotal}>{fmt(uncategorized.reduce((s, e) => s + (+e.amount || 0), 0))}</Typography>
          </Box>
          <Collapse in={expanded.has('_uncategorized')} timeout={150}>
            <Box className={classes.expenseList}>
              {uncategorized.map(exp => (
                <Box key={exp.id} className={classes.expenseRow}>
                  <Typography className={classes.expenseName}>{exp.itemName}</Typography>
                  <Typography className={classes.expenseAmount}>{fmt(exp.amount)}</Typography>
                  {canEdit && (
                    <>
                      <Tooltip title="Edit" arrow>
                        <IconButton size="small" className={classes.rowAction} onClick={() => onEditExpense(exp)}>
                          <EditOutlinedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton size="small" className={classes.rowDelete} onClick={() => onDeleteExpense(exp)}>
                          <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* ── Category ⋮ Menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        PaperProps={{ className: classes.menuPaper }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {canEdit && [
          <MenuItem key="edit" className={classes.menuItem}
            onClick={() => { onEditCategory(menuCat); closeMenu() }}>
            <ListItemIcon className={classes.menuIcon}><EditOutlinedIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            Edit Category
          </MenuItem>,
          <Divider key="d1" sx={{ borderColor: 'rgba(255,255,255,0.07)', my: '4px' }} />,
          <MenuItem key="copy" className={classes.menuItem}
            onClick={handleCopyCat}
            disabled={!monthExps.filter(e => e.categoryId === menuCat?.id).length}>
            <ListItemIcon className={classes.menuIcon}>📋</ListItemIcon>
            Copy to Next Month
          </MenuItem>,
          <MenuItem key="up" className={classes.menuItem}
            disabled={categories.findIndex(c => c.id === menuCat?.id) === 0}
            onClick={handleMoveUp}>
            <ListItemIcon className={classes.menuIcon}><ArrowUpwardIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            Move Up
          </MenuItem>,
          <MenuItem key="down" className={classes.menuItem}
            disabled={categories.findIndex(c => c.id === menuCat?.id) === categories.length - 1}
            onClick={handleMoveDown}>
            <ListItemIcon className={classes.menuIcon}><ArrowDownwardIcon sx={{ fontSize: 15 }} /></ListItemIcon>
            Move Down
          </MenuItem>,
          <Divider key="d2" sx={{ borderColor: 'rgba(255,255,255,0.07)', my: '4px' }} />,
          <MenuItem key="delete" className={classes.menuItemDanger}
            onClick={() => { onDeleteCategory(menuCat); closeMenu() }}>
            <ListItemIcon className={classes.menuIcon}><DeleteOutlinedIcon sx={{ fontSize: 15, color: '#ff7070' }} /></ListItemIcon>
            Delete Category
          </MenuItem>
        ]}
      </Menu>
    </Box>
  )
}
