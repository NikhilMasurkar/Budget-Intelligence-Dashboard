import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react'
import {
  Box, Typography, Button, IconButton, Tooltip,
  Collapse, Menu, MenuItem, ListItemIcon, Divider,
  Checkbox, TextField, InputAdornment
} from '@mui/material'
import MonthStepper from '../MonthStepper'
import PushPinIcon from '@mui/icons-material/PushPin'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import SearchIcon from '@mui/icons-material/Search'
import { MONTHS, fmt } from '../../utils/constants'
import { isInvestmentCategory } from '../../utils/money'
import { useExpensesByCategoryStyles, useExpensesByCategoryUi } from './styles/ExpensesByCategory.styles'
import ExpenseCommentsModal from './ExpenseCommentsModal'
import ExpenseRow from './ExpenseRow'
import { CategoryBudgetText, MonthSummaryBar, BulkActionBar } from './ExpenseBars'
import { useGlobalStyles } from '../../styles/globalStyles'
import ColorDot from '../ColorDot'

export default memo(function ExpensesByCategory({
  expenses, income = [], categories, year, month, availableYears,
  onYearChange, onMonthChange,
  onAddExpense, onEditExpense, onDeleteExpense,
  onAddCategory, onEditCategory, onDeleteCategory,
  onReorderCategory, onCopyToNextMonth,
  selectedIds = [], onSelectionChange, onBulkPin, onBulkDelete,
  onSaveComment,
  canEdit,
}) {
  const { classes: ui, cx: uiCx } = useExpensesByCategoryUi()
  const { classes, cx } = useExpensesByCategoryStyles()
  const { classes: g } = useGlobalStyles()
  const canChange = canEdit

  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuCat, setMenuCat] = useState(null)
  const [commentExp, setCommentExp] = useState(null)
  const [commentSaving, setCommentSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [fixedOnly, setFixedOnly] = useState(false)

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

  // Categories with something in them start open. Reset only when the viewed
  // month changes — not on data reloads, so a hand-collapsed one stays shut.
  const [expanded, setExpanded] = useState(() => new Set(monthByCat.keys()))
  useEffect(() => { setExpanded(new Set(monthByCat.keys())) }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps
  // A category that just got its first item opens, so the new row is visible.
  const prevCatKeys = useRef(new Set(monthByCat.keys()))
  useEffect(() => {
    const added = [...monthByCat.keys()].filter(k => !prevCatKeys.current.has(k))
    prevCatKeys.current = new Set(monthByCat.keys())
    if (added.length) setExpanded(prev => new Set([...prev, ...added]))
  }, [monthByCat])

  // ── Search + fixed-only filter ─────────────────────────────────────────────
  const q = search.trim().toLowerCase()
  const filterActive = !!q || fixedOnly
  const matches = (e) =>
    (!q || String(e.itemName || '').toLowerCase().includes(q)) &&
    (!fixedOnly || e.isFixed === true)

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

  // ── Multi-select for bulk actions ──────────────────────────────────────────
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedExpenses = useMemo(
    () => monthExps.filter(e => selectedSet.has(e.id)),
    [monthExps, selectedSet]
  )

  // Selection is per-period — clear it when the year/month changes so stale
  // ids from another month don't linger.
  useEffect(() => { onSelectionChange?.([]) }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <MonthStepper year={year} month={month} availableYears={availableYears}
          onYearChange={onYearChange} onMonthChange={onMonthChange} />
        <Box className={classes.flexFiller} />
        <Box className={ui.box1}>
          <Button className={ui.button1} size="small" variant="text"
            onClick={expanded.size > 0 ? collapseAll : expandAll}
           >
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
        <MonthSummaryBar monthLabel={MONTHS[month - 1]} income={monthIncomeTotal}
          realSpend={realSpend} invested={invested} itemCount={itemCount} />
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
              startAdornment: <InputAdornment position="start"><SearchIcon className={ui.searchIcon1} /></InputAdornment>
            }}
          />
          <Button
            variant={fixedOnly ? 'contained' : 'outlined'}
            startIcon={<PushPinIcon className={ui.pushPinIcon1} />}
            onClick={() => setFixedOnly(v => !v)}
            className={uiCx(classes.fixedToggleBtn, fixedOnly ? ui.fixedOn : ui.fixedOff)}
          >
            Fixed only
          </Button>
        </Box>
      )}

      {/* ── Bulk action bar ── */}
      {canChange && selectedExpenses.length > 0 && (
        <BulkActionBar selected={selectedExpenses} onPin={onBulkPin} onCopy={onCopyToNextMonth}
          onDelete={onBulkDelete} onClear={() => onSelectionChange([])} />
      )}

      {/* ── Category Sections ── */}
      {categories.length === 0 && (
        <Box className={ui.box2}>
          No categories yet. Click "+ Category" to add one.
        </Box>
      )}

      {[
        { key: 'spend', label: 'Spending', cats: spendCats, total: realSpend },
        { key: 'invest', label: 'Investments & Savings', cats: investCats, total: invested },
      ].map(group => group.cats.length === 0 ? null : (
        <Box key={group.key}>
          <Box className={uiCx(ui.groupHeader, group.key === 'spend' && ui.groupHeaderFirst)}>
            <Typography className={uiCx(ui.groupLabel, group.key === 'invest' && ui.invest)}>
              {group.label}
            </Typography>
            {group.key === 'invest' && (deposits > 0 || withdrawals > 0) && (
              <Typography className={ui.typography1}>
                put in {fmt(deposits)} · took out {fmt(withdrawals)}
              </Typography>
            )}
            <Box className={ui.box3} />
            <Typography className={uiCx(ui.groupTotal, group.key === 'invest' && ui.invest)}>
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
                    {canChange && catExpsFull.length > 0 && (
                      <Tooltip title={catAllSelected ? 'Deselect all' : 'Select all in category'} arrow>
                        <Checkbox className={ui.checkbox1}
                          size="small"
                          checked={catAllSelected}
                          indeterminate={catSomeSelected && !catAllSelected}
                          onClick={e => e.stopPropagation()}
                          onChange={e => toggleCategoryAll(catExpsFull, e.target.checked)}
                        />
                      </Tooltip>
                    )}
                    <ColorDot className={classes.colorDot} color={cat.color || 'var(--accent)'} />
                    <Typography className={classes.catName}>{cat.name}</Typography>
                    {catExpsFull.length > 0 && (
                      <Typography className={classes.catMeta}>{catExpsFull.length} item{catExpsFull.length !== 1 ? 's' : ''}</Typography>
                    )}
                    <Typography className={uiCx(classes.catTotal, catTotalFull < 0 ? ui.totalNegative : catTotalFull > 0 ? ui.totalPositive : ui.totalZero)}>
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

                    {canChange && (
                      <IconButton size="small" className={classes.menuBtn} aria-label="Category options" onClick={e => openMenu(e, cat)}>
                        <MoreVertIcon className={ui.moreVertIcon1} />
                      </IconButton>
                    )}
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
                          canEdit={canChange && !exp.pending}
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
                <Box className={uiCx(classes.colorDot, ui.box4)} />
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
                    canEdit={canChange && !exp.pending}
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
          canEdit={canChange}
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
        {canChange && [
          <MenuItem key="edit" className={classes.menuItem}
            onClick={() => { onEditCategory(menuCat); closeMenu() }}>
            <ListItemIcon className={classes.menuIcon}><EditOutlinedIcon className={ui.editOutlinedIcon1} /></ListItemIcon>
            Edit Category
          </MenuItem>,
          <Divider className={ui.divider1} key="d1" />,
          <MenuItem key="copy" className={classes.menuItem}
            onClick={handleCopyCat}
            disabled={!(monthByCat.get(menuCat?.id) || []).length}>
            <ListItemIcon className={classes.menuIcon}>📋</ListItemIcon>
            Copy to Next Month
          </MenuItem>,
          <MenuItem key="up" className={classes.menuItem}
            disabled={categories.findIndex(c => c.id === menuCat?.id) === 0}
            onClick={handleMoveUp}>
            <ListItemIcon className={classes.menuIcon}><ArrowUpwardIcon className={ui.arrowUpwardIcon1} /></ListItemIcon>
            Move Up
          </MenuItem>,
          <MenuItem key="down" className={classes.menuItem}
            disabled={categories.findIndex(c => c.id === menuCat?.id) === categories.length - 1}
            onClick={handleMoveDown}>
            <ListItemIcon className={classes.menuIcon}><ArrowDownwardIcon className={ui.arrowDownwardIcon1} /></ListItemIcon>
            Move Down
          </MenuItem>,
          <Divider className={ui.divider2} key="d2" />,
          <MenuItem key="delete" className={classes.menuItemDanger}
            onClick={() => { onDeleteCategory(menuCat); closeMenu() }}>
            <ListItemIcon className={classes.menuIcon}><DeleteOutlinedIcon className={ui.deleteOutlinedIcon1} /></ListItemIcon>
            Delete Category
          </MenuItem>
        ]}
      </Menu>
    </Box>
  )
})
