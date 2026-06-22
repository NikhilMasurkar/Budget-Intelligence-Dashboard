import React, { useState, useMemo, useEffect } from 'react'
import {
  Box, Typography, Button, IconButton, Tooltip,
  Collapse, Menu, MenuItem, ListItemIcon, Divider,
  FormControl, Select, Checkbox, TextField, InputAdornment
} from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { makeStyles } from 'tss-react/mui'
import { MONTHS, fmt } from '../../utils/constants'
import ExpenseCommentsModal, { parseComments } from './ExpenseCommentsModal'

function fmtUpdated(raw) {
  if (!raw) return null
  const s = String(raw)
  if (!s.startsWith('U')) return null
  const ms = +s.slice(1)
  if (!ms || isNaN(ms)) return null
  const diffMs   = Date.now() - ms
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs  = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1)  return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs  < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays  < 7) return `${diffDays}d ago`
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
import { useGlobalStyles } from '../../styles/globalStyles'

const useStyles = makeStyles()((theme) => ({
  headerRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '20px', flexWrap: 'wrap'
  },
  title: { fontWeight: 700, fontSize: '22px', color: theme.palette.text.primary },
  flexFiller: { flex: 1 },
  // Summary / money-story bar
  totalBar: {
    display: 'flex', gap: '20px', marginBottom: '12px',
    padding: '12px 16px', alignItems: 'center', flexWrap: 'wrap',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    [theme.breakpoints.down('sm')]: { gap: '14px', padding: '12px 14px' }
  },
  statBlock: {
    display: 'flex', flexDirection: 'column', minWidth: 0,
    [theme.breakpoints.down('sm')]: { flex: '1 0 30%' }
  },
  statLabel: { fontSize: 10, color: '#8891b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 },
  statValue: { fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 },
  // Filter bar
  filterBar: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'stretch' },
  searchField: {
    flex: 1, minWidth: '200px',
    '& .MuiOutlinedInput-root': {
      height: 42, borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)', fontSize: 14, color: '#e4e8f5',
      paddingLeft: '12px',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#5b7fff', borderWidth: '1px' }
    },
    '& .MuiOutlinedInput-input': { padding: '0 8px', color: '#e4e8f5' },
    '& .MuiOutlinedInput-input::placeholder': { color: '#6a7190', opacity: 1 }
  },
  fixedToggleBtn: {
    height: 42, fontSize: 13, fontWeight: 700, textTransform: 'none',
    borderRadius: '10px', paddingLeft: '16px', paddingRight: '16px', whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: { flex: 1 }
  },
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
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px',
    padding: '12px 14px',
    cursor: 'pointer',
    userSelect: 'none',
    background: '#181b28',
    '&:hover': { background: 'rgba(255,255,255,0.025)' },
    '&:focus-visible': { outline: '2px solid #5b7fff', outlineOffset: '-2px' },
    transition: 'background 0.15s'
  },
  sectionHeaderExpanded: { background: 'rgba(255,255,255,0.03)' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%' },
  colorDot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0
  },
  catName: {
    fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.5px',
    textTransform: 'uppercase', color: '#c8cfea', flex: 1,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  catMeta: {
    fontSize: 12, color: '#8891b8', whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: { display: 'none' }
  },
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
    padding: '10px 16px 10px 36px', minHeight: 52,
    borderTop: '1px solid rgba(255,255,255,0.04)',
    '&:hover': { background: 'rgba(255,255,255,0.015)' },
    transition: 'background 0.12s',
    [theme.breakpoints.down('sm')]: {
      padding: '14px 12px', minHeight: 64, gap: '8px'
    }
  },
  expenseName: {
    flex: 1, fontWeight: 600, fontSize: '13px',
    color: '#e4e8f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  fixedBadge: {
    fontSize: 9, background: 'rgba(91,127,255,0.15)',
    color: '#a0b4ff', border: '1px solid rgba(91,127,255,0.3)',
    borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
    letterSpacing: '0.3px', flexShrink: 0
  },
  withdrawBadge: {
    fontSize: 9, background: 'rgba(255,95,95,0.15)',
    color: '#ff7a7a', border: '1px solid rgba(255,95,95,0.3)',
    borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
    letterSpacing: '0.3px', flexShrink: 0, whiteSpace: 'nowrap'
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

// Compact budget-vs-actual text shown in a category header when a budget is set.
function CategoryBudgetText({ actual, budget }) {
  const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0
  const over = actual > budget
  const color = over ? '#ff7a7a' : pct > 80 ? '#ffb03a' : '#8891b8'
  return (
    <Typography sx={{ fontSize: 11, color, fontWeight: 600, pl: '20px' }}>
      Budget {fmt(actual)} / {fmt(budget)} · {pct}%{over ? ' · over' : ''}
    </Typography>
  )
}

export default function ExpensesByCategory({
  expenses, income = [], categories, year, month, availableYears,
  onYearChange, onMonthChange,
  onAddExpense, onEditExpense, onDeleteExpense,
  onAddCategory, onEditCategory, onDeleteCategory,
  onReorderCategory, onCopyToNextMonth,
  selectedIds = [], onSelectionChange, onBulkPin, onBulkDelete,
  onSaveComment,
  canEdit
}) {
  const { classes, cx } = useStyles()
  const { classes: g } = useGlobalStyles()

  const [expanded, setExpanded] = useState(new Set())
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuCat, setMenuCat] = useState(null)
  const [commentExp, setCommentExp] = useState(null)
  const [commentSaving, setCommentSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [fixedOnly, setFixedOnly] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  const monthExps = useMemo(() =>
    expenses.filter(e => String(e.year) === String(year) && String(e.month) === String(month))
  , [expenses, year, month])

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c]))
  , [categories])

  // Group this month's expenses by category once — avoids re-filtering per category each render.
  const monthByCat = useMemo(() => {
    const m = new Map()
    monthExps.forEach(e => {
      const key = catMap[e.categoryId] ? e.categoryId : '_uncategorized'
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(e)
    })
    return m
  }, [monthExps, catMap])

  // ── Search + fixed-only filter ─────────────────────────────────────────────
  const q = search.trim().toLowerCase()
  const filterActive = !!q || fixedOnly
  const matches = (e) =>
    (!q || String(e.itemName || '').toLowerCase().includes(q)) &&
    (!fixedOnly || e.isFixed === 'TRUE')

  // ── Money-story summary ────────────────────────────────────────────────────
  const monthIncomeTotal = useMemo(() =>
    income
      .filter(i => String(i.year) === String(year) && String(i.month) === String(month))
      .reduce((s, i) => s + (+i.amount || 0), 0)
  , [income, year, month])
  // "Spent" and "Saved" exclude Investment/Savings categories — money moved
  // into or out of investments is a wealth transfer, not consumption. (A
  // deposit is still "saved", just not as cash; a withdrawal is previously
  // saved money, not new income.) Counting them would drag Spent negative and
  // inflate Saved past income whenever there's a withdrawal.
  const realSpend = monthExps
    .filter(e => catMap[e.categoryId]?.type !== 'savings')
    .reduce((s, e) => s + (+e.amount || 0), 0)
  const itemCount = monthExps.length
  const saved = monthIncomeTotal - realSpend
  const spentPct = monthIncomeTotal > 0 ? Math.min(100, Math.round((realSpend / monthIncomeTotal) * 100)) : 0

  // ── Multi-select for bulk actions ──────────────────────────────────────────
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedExpenses = useMemo(
    () => monthExps.filter(e => selectedSet.has(e.id)),
    [monthExps, selectedSet]
  )

  // Selection is per-period — clear it when the year/month changes so stale
  // ids from another month don't linger.
  useEffect(() => { onSelectionChange?.([]) }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps
  // Reset the inline delete-confirm whenever the selection changes.
  useEffect(() => { setBulkDeleteConfirm(false) }, [selectedIds])

  const toggleExpense = (id, checked) => {
    if (checked) onSelectionChange([...selectedIds, id])
    else onSelectionChange(selectedIds.filter(x => x !== id))
  }
  const toggleCategoryAll = (catExps, checked) => {
    const ids = catExps.map(e => e.id)
    if (checked) onSelectionChange(Array.from(new Set([...selectedIds, ...ids])))
    else {
      const rm = new Set(ids)
      onSelectionChange(selectedIds.filter(x => !rm.has(x)))
    }
  }

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
    const catExps = monthByCat.get(menuCat.id) || []
    if (catExps.length) onCopyToNextMonth(catExps.map(e => e.id))
    closeMenu()
  }

  // Unified expense-row renderer — used by both category and uncategorized sections.
  const renderExpenseRow = (exp) => {
    const commentCount = parseComments(exp.note).length
    return (
      <Box key={exp.id} className={classes.expenseRow}
        sx={selectedSet.has(exp.id) ? { background: 'rgba(91,127,255,0.06)' } : undefined}>
        {canEdit && (
          <Checkbox
            size="small"
            checked={selectedSet.has(exp.id)}
            onChange={e => toggleExpense(exp.id, e.target.checked)}
            sx={{ p: 0, mr: '2px', color: '#3d4466', '&.Mui-checked': { color: '#5b7fff' } }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography className={classes.expenseName} sx={{ flex: 'unset' }}>{exp.itemName}</Typography>
          {fmtUpdated(exp.updatedAt) && (
            <Typography sx={{ fontSize: 10, color: '#3d4466', display: 'block', lineHeight: 1.4 }}>
              Updated {fmtUpdated(exp.updatedAt)}
            </Typography>
          )}
        </Box>
        {exp.isFixed === 'TRUE' && (
          <Box component="span" className={classes.fixedBadge}>📌</Box>
        )}
        {+exp.amount < 0 && (
          <Box component="span" className={classes.withdrawBadge}>↓ WITHDRAWN</Box>
        )}
        <Typography
          className={classes.expenseAmount}
          sx={+exp.amount < 0 ? { color: '#ff7a7a' } : undefined}
        >
          {fmt(exp.amount)}
        </Typography>
        <Tooltip title={commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add comment'} arrow>
          <IconButton
            size="small"
            onClick={() => setCommentExp(exp)}
            sx={{
              p: '3px', position: 'relative',
              color: commentCount > 0 ? '#5b7fff' : '#4a5072',
              '&:hover': { color: '#5b7fff', background: 'rgba(91,127,255,0.1)' }
            }}
          >
            <ChatBubbleOutlinedIcon sx={{ fontSize: 14 }} />
            {commentCount > 0 && (
              <Box component="span" sx={{
                position: 'absolute', top: 0, right: 0,
                fontSize: 8, fontWeight: 800, lineHeight: 1,
                background: '#5b7fff', color: '#fff',
                borderRadius: '50%', width: 12, height: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {commentCount > 9 ? '9+' : commentCount}
              </Box>
            )}
          </IconButton>
        </Tooltip>
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
    )
  }

  const uncategorized = monthByCat.get('_uncategorized') || []

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

      {/* ── Money-story summary bar ── */}
      {itemCount > 0 && (
        <Box className={classes.totalBar}>
          <Box className={classes.statBlock}>
            <Typography className={classes.statLabel}>{MONTHS[month - 1]} Income</Typography>
            <Typography className={classes.statValue} sx={{ color: '#3de8a0' }}>{fmt(monthIncomeTotal)}</Typography>
          </Box>
          <Box className={classes.statBlock}>
            <Typography className={classes.statLabel}>Spent</Typography>
            <Typography className={classes.statValue} sx={{ color: '#ff7a7a' }}>{fmt(realSpend)}</Typography>
          </Box>
          <Box className={classes.statBlock}>
            <Typography className={classes.statLabel}>{saved >= 0 ? 'Saved' : 'Over budget'}</Typography>
            <Typography className={classes.statValue} sx={{ color: saved >= 0 ? '#a0b4ff' : '#ff7a7a' }}>
              {fmt(Math.abs(saved))}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Box sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <Box sx={{
                width: `${spentPct}%`, height: '100%', transition: 'width 0.3s',
                background: spentPct >= 100 ? '#ff7a7a' : spentPct > 80 ? '#ffb03a' : '#5b7fff'
              }} />
            </Box>
            <Typography sx={{ fontSize: 10, color: '#8891b8', mt: '4px' }}>
              {monthIncomeTotal > 0 ? `${spentPct}% of income spent · ${itemCount} item${itemCount !== 1 ? 's' : ''}` : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Search + filter bar ── */}
      {itemCount > 0 && (
        <Box className={classes.filterBar}>
          <TextField
            className={classes.searchField}
            placeholder="Search expenses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#5a6080' }} /></InputAdornment>
            }}
          />
          <Button
            variant={fixedOnly ? 'contained' : 'outlined'}
            startIcon={<PushPinIcon sx={{ fontSize: 15 }} />}
            onClick={() => setFixedOnly(v => !v)}
            className={classes.fixedToggleBtn}
            sx={fixedOnly ? {
              background: '#5b7fff', '&:hover': { background: '#4a6def' }
            } : {
              color: '#a0b4ff', borderColor: 'rgba(91,127,255,0.35)',
              '&:hover': { borderColor: 'rgba(91,127,255,0.6)', background: 'rgba(91,127,255,0.07)' }
            }}
          >
            Fixed only
          </Button>
        </Box>
      )}

      {/* ── Bulk action bar ── */}
      {canEdit && selectedExpenses.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '10px', flexWrap: 'wrap',
          background: 'rgba(91,127,255,0.1)',
          border: '1px solid rgba(91,127,255,0.35)',
          borderRadius: '10px', position: 'sticky', top: 8, zIndex: 5,
          backdropFilter: 'blur(6px)'
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#a0b4ff' }}>
            {selectedExpenses.length} selected
          </Typography>
          <Box sx={{ flex: 1 }} />
          {bulkDeleteConfirm ? (
            <>
              <Typography sx={{ fontSize: 12, color: '#ff9b9b' }}>
                Delete {selectedExpenses.length}?
              </Typography>
              <Button
                size="small" variant="contained"
                onClick={() => { onBulkDelete(selectedExpenses); setBulkDeleteConfirm(false) }}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px', background: '#ff5f5f', '&:hover': { background: '#e64a4a' } }}
              >
                Yes, delete
              </Button>
              <Button
                size="small" variant="text"
                onClick={() => setBulkDeleteConfirm(false)}
                sx={{ fontSize: 12, color: '#8891b8', textTransform: 'none', minWidth: 0 }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small" variant="contained" startIcon={<PushPinIcon sx={{ fontSize: 15 }} />}
                onClick={() => onBulkPin(selectedExpenses, true)}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px', background: '#5b7fff', '&:hover': { background: '#4a6def' } }}
              >
                Pin
              </Button>
              <Button
                size="small" variant="outlined"
                onClick={() => onBulkPin(selectedExpenses, false)}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px', color: '#a0b4ff', borderColor: 'rgba(91,127,255,0.4)', '&:hover': { borderColor: 'rgba(91,127,255,0.7)', background: 'rgba(91,127,255,0.08)' } }}
              >
                Unpin
              </Button>
              <Button
                size="small" variant="outlined"
                onClick={() => onCopyToNextMonth(selectedExpenses.map(e => e.id))}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px', color: '#c8cfea', borderColor: 'rgba(255,255,255,0.15)', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' } }}
              >
                📋 Copy to next month
              </Button>
              <Button
                size="small" variant="outlined" startIcon={<DeleteOutlinedIcon sx={{ fontSize: 15 }} />}
                onClick={() => setBulkDeleteConfirm(true)}
                sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', borderRadius: '7px', color: '#ff7a7a', borderColor: 'rgba(255,95,95,0.4)', '&:hover': { borderColor: 'rgba(255,95,95,0.7)', background: 'rgba(255,95,95,0.08)' } }}
              >
                Delete
              </Button>
              <Button
                size="small" variant="text"
                onClick={() => onSelectionChange([])}
                sx={{ fontSize: 12, color: '#8891b8', textTransform: 'none', minWidth: 0 }}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
      )}

      {/* ── Category Sections ── */}
      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: '#8891b8', fontSize: 14 }}>
          No categories yet. Click "+ Category" to add one.
        </Box>
      )}

      {categories.map((cat) => {
        const catExpsFull = monthByCat.get(cat.id) || []
        const catTotalFull = catExpsFull.reduce((s, e) => s + (+e.amount || 0), 0)
        const visibleExps = filterActive ? catExpsFull.filter(matches) : catExpsFull
        // When a filter is active, hide categories with no matching rows.
        if (filterActive && visibleExps.length === 0) return null
        const isOpen = filterActive ? true : expanded.has(cat.id)
        const catAllSelected = catExpsFull.length > 0 && catExpsFull.every(e => selectedSet.has(e.id))
        const catSomeSelected = catExpsFull.some(e => selectedSet.has(e.id))

        return (
          <Box key={cat.id} className={cx(classes.section, isOpen && classes.sectionExpanded)}>
            {/* Section Header */}
            <Box
              className={cx(classes.sectionHeader, isOpen && classes.sectionHeaderExpanded)}
              onClick={() => toggle(cat.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onKeyDown={e => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault(); toggle(cat.id)
                }
              }}
            >
              <Box className={classes.sectionHeaderRow}>
                {isOpen
                  ? <ExpandLessIcon className={classes.expandIcon} />
                  : <ExpandMoreIcon className={classes.expandIcon} />
                }
                {canEdit && catExpsFull.length > 0 && (
                  <Tooltip title={catAllSelected ? 'Deselect all' : 'Select all in category'} arrow>
                    <Checkbox
                      size="small"
                      checked={catAllSelected}
                      indeterminate={catSomeSelected && !catAllSelected}
                      onClick={e => e.stopPropagation()}
                      onChange={e => toggleCategoryAll(catExpsFull, e.target.checked)}
                      sx={{
                        p: 0, color: '#4a5072',
                        '&.Mui-checked': { color: '#5b7fff' },
                        '&.MuiCheckbox-indeterminate': { color: '#5b7fff' }
                      }}
                    />
                  </Tooltip>
                )}
                <Box className={classes.colorDot} style={{ background: cat.color || '#5b7fff' }} />
                <Typography className={classes.catName}>{cat.name}</Typography>
                {catExpsFull.length > 0 && (
                  <Typography className={classes.catMeta}>{catExpsFull.length} item{catExpsFull.length !== 1 ? 's' : ''}</Typography>
                )}
                <Typography className={classes.catTotal} style={{ color: catTotalFull < 0 ? '#ff7a7a' : catTotalFull > 0 ? '#e4e8f5' : '#5a6080' }}>
                  {catTotalFull !== 0 ? fmt(catTotalFull) : '—'}
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
              {cat.budget > 0 && <CategoryBudgetText actual={catTotalFull} budget={cat.budget} />}
            </Box>

            {/* Expense rows */}
            <Collapse in={isOpen} timeout={150}>
              <Box className={classes.expenseList}>
                {visibleExps.length === 0 ? (
                  <Box className={classes.emptyRow}>No expenses this month</Box>
                ) : (
                  visibleExps.map(exp => renderExpenseRow(exp))
                )}
              </Box>
            </Collapse>
          </Box>
        )
      })}

      {/* Uncategorized section */}
      {(() => {
        const visibleUncat = filterActive ? uncategorized.filter(matches) : uncategorized
        if (uncategorized.length === 0 || (filterActive && visibleUncat.length === 0)) return null
        const uncatTotal = uncategorized.reduce((s, e) => s + (+e.amount || 0), 0)
        const isOpen = filterActive ? true : expanded.has('_uncategorized')
        return (
          <Box className={cx(classes.section, isOpen && classes.sectionExpanded)}>
            <Box
              className={cx(classes.sectionHeader, isOpen && classes.sectionHeaderExpanded)}
              onClick={() => toggle('_uncategorized')}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onKeyDown={e => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault(); toggle('_uncategorized')
                }
              }}
            >
              <Box className={classes.sectionHeaderRow}>
                {isOpen
                  ? <ExpandLessIcon className={classes.expandIcon} />
                  : <ExpandMoreIcon className={classes.expandIcon} />
                }
                <Box className={classes.colorDot} style={{ background: '#8891b8' }} />
                <Typography className={classes.catName}>Uncategorized</Typography>
                <Typography className={classes.catMeta}>{uncategorized.length} item{uncategorized.length !== 1 ? 's' : ''}</Typography>
                <Typography className={classes.catTotal}>{fmt(uncatTotal)}</Typography>
              </Box>
            </Box>
            <Collapse in={isOpen} timeout={150}>
              <Box className={classes.expenseList}>
                {visibleUncat.map(exp => renderExpenseRow(exp))}
              </Box>
            </Collapse>
          </Box>
        )
      })()}

      {/* ── Comment Modal ── */}
      {commentExp && (
        <ExpenseCommentsModal
          expense={commentExp}
          saving={commentSaving}
          onClose={() => { if (!commentSaving) setCommentExp(null) }}
          onSave={async (exp, noteJson) => {
            setCommentSaving(true)
            try {
              await onSaveComment?.(exp, noteJson)
              // Refresh the local expense so the modal shows the new comment immediately
              setCommentExp(prev => prev ? { ...prev, note: noteJson } : null)
            } finally {
              setCommentSaving(false)
            }
          }}
        />
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
            disabled={!(monthByCat.get(menuCat?.id) || []).length}>
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
