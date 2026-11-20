import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '95%',
      maxWidth: '850px',
      borderRadius: '12px',
      border: '1px solid rgb(var(--ink-rgb) / 0.13)',
      backgroundColor: 'var(--bg)',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflowY: 'auto', maxHeight: 'calc(100dvh - 32px)',
      margin: '16px'
    }
  },
  content: {
    padding: '20px',
    [theme.breakpoints.up('sm')]: {
      padding: '28px'
    }
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  categoryLabel: {
    fontSize: '10.5px',
    textTransform: 'uppercase',
    fontWeight: 800,
    letterSpacing: '1px',
    marginBottom: '4px',
    display: 'block'
  },
  categoryName: {
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--text)'
  },
  closeButton: {
    color: 'var(--text2)',
    '&:hover': {
      color: 'var(--text)'
    }
  },
  infoBanner: {
    backgroundColor: 'var(--surface2)',
    border: '1px solid rgb(var(--ink-rgb) / 0.05)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bannerLabel: {
    fontSize: '11px',
    color: 'var(--text2)',
    fontWeight: 600,
    display: 'block',
    marginBottom: '4px'
  },
  bannerValueTotal: {
    fontSize: '20px',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums'
  },
  bannerValuePeriod: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: 'var(--text)'
  },
  tableContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    overflowX: 'auto',
    border: '1px solid rgb(var(--ink-rgb) / 0.08)',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    borderRadius: '8px',
    '&::-webkit-scrollbar': { width: '6px', height: '6px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgb(var(--ink-rgb) / 0.1)', borderRadius: '3px' }
  },
  thCell: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: 'var(--text2)',
    fontWeight: 700,
    backgroundColor: 'var(--surface2)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  thCellRight: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: 'var(--text2)',
    fontWeight: 700,
    backgroundColor: 'var(--surface2)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
    whiteSpace: 'nowrap'
  },
  thCellTotal: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 800,
    backgroundColor: 'var(--surface2)',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  tableRow: {
    '& td': { borderBottom: '1px solid rgb(var(--ink-rgb) / 0.04)' },
    '&:last-child td': { border: 0 }
  },
  monthCell: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text2)',
    backgroundColor: 'rgb(var(--ink-rgb) / 0.01)',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  valueCell: {
    fontSize: '12.5px',
    fontVariantNumeric: 'tabular-nums',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  monthTotalCell: {
    fontSize: '12.5px',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    backgroundColor: 'rgb(var(--ink-rgb) / 0.02)',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '14px',
    paddingRight: '14px'
  }
}))

// Moved from inline sx/style in CategoryDetailsDialog.jsx.
export const useCategoryDetailsDialogUi = makeStyles()(() => ({
  box1: {
    textAlign: 'right',
  },
  tableRow1: {
    "& th": {
      borderBottom: '1px solid rgb(var(--ink-rgb) / 0.08)',
    },
  },
  valueNegative: { color: 'var(--danger-soft)' },
  valuePositive: { color: 'var(--text)' },
  valueZero: { color: 'var(--text2)' },
}))
