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
