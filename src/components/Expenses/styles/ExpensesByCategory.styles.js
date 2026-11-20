import { makeStyles } from 'tss-react/mui'

export const useExpensesByCategoryStyles = makeStyles()((theme) => ({
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
    background: 'rgb(var(--ink-rgb) / 0.02)',
    border: '1px solid rgb(var(--ink-rgb) / 0.06)',
    borderRadius: '10px',
    [theme.breakpoints.down('sm')]: { gap: '14px', padding: '12px 14px' }
  },
  statBlock: {
    display: 'flex', flexDirection: 'column', minWidth: 0,
    [theme.breakpoints.down('sm')]: { flex: '1 0 30%' }
  },
  statLabel: { fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 },
  statValue: { fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25 },
  // Filter bar
  filterBar: { display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'stretch' },
  searchField: {
    flex: 1, minWidth: '200px',
    '& .MuiOutlinedInput-root': {
      height: 42, borderRadius: '10px',
      background: 'rgb(var(--ink-rgb) / 0.04)', fontSize: 14, color: 'var(--text)',
      paddingLeft: '12px',
      '& fieldset': { borderColor: 'rgb(var(--ink-rgb) / 0.1)' },
      '&:hover fieldset': { borderColor: 'rgb(var(--ink-rgb) / 0.2)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--accent)', borderWidth: '1px' }
    },
    '& .MuiOutlinedInput-input': { padding: '0 8px', color: 'var(--text)' },
    '& .MuiOutlinedInput-input::placeholder': { color: 'var(--text-muted)', opacity: 1 }
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
    border: '1px solid rgb(var(--ink-rgb) / 0.07)',
    overflow: 'hidden',
    transition: 'border-color 0.15s'
  },
  sectionExpanded: { borderColor: 'rgb(var(--ink-rgb) / 0.13)' },
  sectionHeader: {
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px',
    padding: '12px 14px',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'var(--surface2)',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.025)' },
    '&:focus-visible': { outline: '2px solid var(--accent)', outlineOffset: '-2px' },
    transition: 'background 0.15s'
  },
  sectionHeaderExpanded: { background: 'rgb(var(--ink-rgb) / 0.03)' },
  sectionHeaderRow: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%' },
  colorDot: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0
  },
  catName: {
    fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.5px',
    textTransform: 'uppercase', color: 'var(--text-soft)', flex: 1,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  catMeta: {
    fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: { display: 'none' }
  },
  catTotal: {
    fontSize: 14, fontWeight: 800, color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    marginLeft: '8px'
  },
  addBtn: {
    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
    borderRadius: '6px', whiteSpace: 'nowrap', minWidth: 0,
    borderColor: 'rgb(var(--accent-rgb) / 0.35)', color: 'var(--accent-soft)',
    '&:hover': { borderColor: 'rgb(var(--accent-rgb) / 0.6)', background: 'rgb(var(--accent-rgb) / 0.07)' }
  },
  menuBtn: {
    color: 'var(--text2)', padding: '4px',
    '&:hover': { color: 'var(--text)', background: 'rgb(var(--ink-rgb) / 0.05)' }
  },
  expandIcon: { color: 'var(--text2)', fontSize: '20px' },
  // Expense rows inside section
  expenseList: { background: 'var(--bg)' },
  expenseRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 16px 10px 36px', minHeight: 52,
    borderTop: '1px solid rgb(var(--ink-rgb) / 0.04)',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.015)' },
    transition: 'background 0.12s',
    [theme.breakpoints.down('sm')]: {
      padding: '14px 12px', minHeight: 64, gap: '8px'
    }
  },
  expenseName: {
    flex: 1, fontWeight: 600, fontSize: '13px',
    color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  fixedBadge: {
    fontSize: 9, background: 'rgb(var(--accent-rgb) / 0.15)',
    color: 'var(--accent-soft)', border: '1px solid rgb(var(--accent-rgb) / 0.3)',
    borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
    letterSpacing: '0.3px', flexShrink: 0
  },
  withdrawBadge: {
    fontSize: 9, background: 'rgb(var(--danger-rgb) / 0.15)',
    color: 'var(--danger-soft)', border: '1px solid rgb(var(--danger-rgb) / 0.3)',
    borderRadius: '4px', padding: '1px 5px', fontWeight: 700,
    letterSpacing: '0.3px', flexShrink: 0, whiteSpace: 'nowrap'
  },
  expenseAmount: {
    fontWeight: 700, fontSize: '13px', color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0
  },
  rowAction: {
    color: 'var(--text2)', padding: '3px',
    '&:hover': { color: 'var(--accent)', background: 'rgb(var(--accent-rgb) / 0.1)' },
    [theme.breakpoints.down('sm')]: { padding: '9px' }
  },
  rowDelete: {
    color: 'var(--text2)', padding: '3px',
    '&:hover': { color: 'var(--danger)', background: 'rgb(var(--danger-rgb) / 0.1)' },
    [theme.breakpoints.down('sm')]: { padding: '9px' }
  },
  emptyRow: {
    padding: '16px 16px 16px 36px',
    borderTop: '1px solid rgb(var(--ink-rgb) / 0.04)',
    color: 'var(--text2)', fontSize: '12px', fontStyle: 'italic'
  },
  menuPaper: {
    background: 'var(--surface2)', border: '1px solid rgb(var(--ink-rgb) / 0.1)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderRadius: '10px',
    minWidth: '190px', padding: '4px'
  },
  menuItem: {
    borderRadius: '6px', fontSize: '13px', gap: '10px',
    padding: '7px 12px', color: 'var(--text-soft)',
    '&:hover': { background: 'rgb(var(--ink-rgb) / 0.05)' }
  },
  menuItemDanger: {
    borderRadius: '6px', fontSize: '13px', gap: '10px',
    padding: '7px 12px', color: 'var(--danger-soft)',
    '&:hover': { background: 'rgb(var(--danger-rgb) / 0.08)' }
  },
  menuIcon: { minWidth: '28px', color: 'inherit' }
}))

// Moved from inline sx/style in ExpensesByCategory.jsx.
export const useExpensesByCategoryUi = makeStyles()((theme) => ({
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  expandToggle: {
    fontSize: 12,
    color: 'var(--text2)',
    textTransform: 'none',
    minWidth: 0,
  },
  searchIcon: {
    fontSize: 18,
    color: 'var(--text-faint)',
  },
  pinIcon: {
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
    color: 'var(--text2)',
    fontSize: 14,
  },
  investFlow: {
    fontSize: 11,
    color: 'var(--text-faint)',
  },
  groupRule: {
    flex: 1,
    height: '1px',
    background: 'rgb(var(--ink-rgb) / 0.06)',
  },
  categoryCheckbox: {
    padding: theme.spacing(0),
    color: 'var(--text3)',
    "&.Mui-checked": {
      color: 'var(--accent)',
    },
    "&.MuiCheckbox-indeterminate": {
      color: 'var(--accent)',
    },
  },
  moreIcon: {
    fontSize: 16,
  },
  uncategorizedDot: {
    background: 'var(--text2)',
  },
  editIcon: {
    fontSize: 15,
  },
  menuDivider: {
    borderColor: 'rgb(var(--ink-rgb) / 0.07)',
    marginTop: '4px',
    marginBottom: '4px',
  },
  upIcon: {
    fontSize: 15,
  },
  downIcon: {
    fontSize: 15,
  },
  menuDividerLower: {
    borderColor: 'rgb(var(--ink-rgb) / 0.07)',
    marginTop: '4px',
    marginBottom: '4px',
  },
  deleteIcon: {
    fontSize: 15,
    color: 'var(--danger-soft)',
  },
  fixedOn: { background: 'var(--accent)', '&:hover': { background: 'var(--accent-strong)' } },
  fixedOff: {
    color: 'var(--accent-soft)', borderColor: 'rgb(var(--accent-rgb) / 0.35)',
    '&:hover': { borderColor: 'rgb(var(--accent-rgb) / 0.6)', background: 'rgb(var(--accent-rgb) / 0.07)' },
  },
  groupHeader: { display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '22px', marginBottom: '8px', paddingLeft: '4px', paddingRight: '4px' },
  groupHeaderFirst: { marginTop: 0 },
  groupLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-muted)' },
  groupTotal: { fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text2)' },
  invest: { color: 'var(--purple)' },
  totalNegative: { color: 'var(--danger-soft)' },
  totalPositive: { color: 'var(--text)' },
  totalZero: { color: 'var(--text-faint)' },
}))
