import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react'
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
import { MONTHS, fmt } from '../../utils/constants'
import { isInvestmentCategory } from '../../utils/money'
import { useExpensesByCategoryStyles } from './styles/ExpensesByCategory.styles'
import ExpenseCommentsModal, { parseComments } from './ExpenseCommentsModal'

function fmtUpdated(raw) {
  if (!raw) return null
  const s = String(raw)
  if (!s.startsWith('U')) return null
  const ms = +s.slice(1)
  if (!ms || isNaN(ms)) return null
  const diffMs = Date.now() - ms
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
import { useGlobalStyles } from '../../styles/globalStyles'


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

// Custom comparator: expense objects are always new refs after loadAll (rebuilt via .map()),
// so we compare individual field values instead of the object reference.
function areRowPropsEqual(prev, next) {
  return (
    prev.exp.id === next.exp.id &&
    prev.exp.amount === next.exp.amount &&
    prev.exp.itemName === next.exp.itemName &&
    prev.exp.isFixed === next.exp.isFixed &&
    prev.exp.note === next.exp.note &&
    prev.exp.updatedAt === next.exp.updatedAt &&
    prev.isSelected === next.isSelected &&
    prev.canEdit === next.canEdit &&
    prev.onToggle === next.onToggle &&
    prev.onComment === next.onComment &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete
  )
}

const ExpenseRow = memo(function ExpenseRow({ exp, classes, canEdit, isSelected, onToggle, onComment, onEdit, onDelete }) {
  const commentCount = parseComments(exp.note).length
  return (
    <Box className={classes.expenseRow}
      sx={isSelected ? { background: 'rgba(91,127,255,0.06)' } : undefined}>
      {canEdit && (
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={e => onToggle(exp.id, e.target.checked)}
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
          onClick={() => onComment(exp)}
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
            <IconButton size="small" className={classes.rowAction} onClick={() => onEdit(exp)}>
              <EditOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" className={classes.rowDelete} onClick={() => onDelete(exp)}>
              <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  )
}, areRowPropsEqual)

export default memo(function ExpensesByCategory({
  expenses, income = [], categories, year, month, availableYears,
  onYearChange, onMonthChange,
  onAddExpense, onEditExpense, onDeleteExpense,
  onAddCategory, onEditCategory, onDeleteCategory,
  onReorderCategory, onCopyToNextMonth,
  selectedIds = [], onSelectionChange, onBulkPin, onBulkDelete,
  onSaveComment,
  canEdit
}) {
  const { classes, cx } = useExpensesByCategoryStyles()
  const { classes: g } = useGlobalStyles()

  const [expanded, setExpanded] = useState(new Set())
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuCat, setMenuCat] = useState(null)
  const [commentExp, setCommentExp] = useState(null)
  const [commentSaving, setCommentSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [fixedOnly, setFixedOnly] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  // Keep a ref to selectedIds so callbacks that toggle selection don't need
  // selectedIds as a dep (avoiding new function refs on every selection change).
  const selectedIdsRef = useRef(selectedIds)
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])

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

  const { realSpend, invested, deposits, withdrawals } = useMemo(() => {
    let realSpend = 0, invested = 0, deposits = 0, withdrawals = 0
    monthExps.forEach(e => {
      const amt = +e.amount || 0
      if (isInvestmentCategory(catMap[e.categoryId])) {
        invested += amt
        if (amt >= 0) deposits += amt
        else withdrawals += -amt
      } else {
        realSpend += amt
      }
    })
    return { realSpend, invested, deposits, withdrawals }
  }, [monthExps, catMap])

  const spendCats = useMemo(() => categories.filter(c => !isInvestmentCategory(c)), [categories])
  const investCats = useMemo(() => categories.filter(c => isInvestmentCategory(c)), [categories])

  const itemCount = monthExps.length
  const remaining = monthIncomeTotal - realSpend - invested
  const outflow = realSpend + invested
  const spentPct = monthIncomeTotal > 0 ? Math.min(100, Math.round((outflow / monthIncomeTotal) * 100)) : 0

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

  // Stable toggle — reads selectedIds via ref so this callback never needs to
  // change when the selection array changes (avoiding row re-renders on every tick).
  const toggleExpense = useCallback((id, checked) => {
    const curr = selectedIdsRef.current
    onSelectionChange(checked ? [...curr, id] : curr.filter(x => x !== id))
  }, [onSelectionChange])

  const toggleCategoryAll = useCallback((catExps, checked) => {
    const curr = selectedIdsRef.current
    const ids = catExps.map(e => e.id)
    if (checked) onSelectionChange(Array.from(new Set([...curr, ...ids])))
    else {
      const rm = new Set(ids)
      onSelectionChange(curr.filter(x => !rm.has(x)))
    }
  }, [onSelectionChange])

  const toggle = useCallback((catId) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }, [])

  const expandAll = () => setExpanded(new Set(categories.map(c => c.id).concat('_uncategorized')))
  const collapseAll = () => setExpanded(new Set())

  const openMenu = (e, cat) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setMenuCat(cat)
  }
  const closeMenu = () => { setMenuAnchor(null); setMenuCat(null) }

  // Stable per-row callbacks passed to memoized ExpenseRow instances.
  const handleToggle = toggleExpense
  const handleComment = useCallback((exp) => setCommentExp(exp), [])
  const handleEdit = useCallback((exp) => onEditExpense(exp), [onEditExpense])
  const handleDelete = useCallback((exp) => onDeleteExpense(exp), [onDeleteExpense])

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
          {invested !== 0 && (
            <Box className={classes.statBlock}>
              <Typography className={classes.statLabel}>Invested</Typography>
              <Typography className={classes.statValue} sx={{ color: '#b97fff' }}>{fmt(invested)}</Typography>
            </Box>
          )}
          <Box className={classes.statBlock}>
            <Typography className={classes.statLabel}>{remaining >= 0 ? 'Remaining' : 'Short by'}</Typography>
            <Typography className={classes.statValue} sx={{ color: remaining >= 0 ? '#a0b4ff' : '#ff7a7a' }}>
              {fmt(Math.abs(remaining))}
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
              {monthIncomeTotal > 0 ? `${spentPct}% of income used · ${itemCount} item${itemCount !== 1 ? 's' : ''}` : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
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

      {[
        { key: 'spend', label: 'Spending', cats: spendCats, total: realSpend },
        { key: 'invest', label: 'Investments & Savings', cats: investCats, total: invested },
      ].map(group => group.cats.length === 0 ? null : (
        <Box key={group.key}>
          <Box sx={{
            display: 'flex', alignItems: 'baseline', gap: '10px',
            mt: group.key === 'spend' ? 0 : '22px', mb: '8px', px: '4px',
          }}>
            <Typography sx={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: group.key === 'invest' ? '#b97fff' : '#6a7190',
            }}>
              {group.label}
            </Typography>
            {group.key === 'invest' && (deposits > 0 || withdrawals > 0) && (
              <Typography sx={{ fontSize: 11, color: '#5a6080' }}>
                put in {fmt(deposits)} · took out {fmt(withdrawals)}
              </Typography>
            )}
            <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <Typography sx={{
              fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: group.key === 'invest' ? '#b97fff' : '#8891b8',
            }}>
              {fmt(group.total)}
            </Typography>
          </Box>

          {group.cats.map((cat) => {
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
                      visibleExps.map(exp => (
                        <ExpenseRow
                          key={exp.id}
                          exp={exp}
                          classes={classes}
                          canEdit={canEdit}
                          isSelected={selectedSet.has(exp.id)}
                          onToggle={handleToggle}
                          onComment={handleComment}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </Box>
                </Collapse>
              </Box>
            )
          })}

        </Box>
      ))}

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
                {visibleUncat.map(exp => (
                  <ExpenseRow
                    key={exp.id}
                    exp={exp}
                    classes={classes}
                    canEdit={canEdit}
                    isSelected={selectedSet.has(exp.id)}
                    onToggle={handleToggle}
                    onComment={handleComment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
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
})
