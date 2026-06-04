import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      width: '95%',
      maxWidth: '850px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.13)',
      backgroundColor: '#101218',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
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
    color: '#e4e8f5'
  },
  closeButton: {
    color: '#8891b8',
    '&:hover': {
      color: '#e4e8f5'
    }
  },
  infoBanner: {
    backgroundColor: '#181b28',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bannerLabel: {
    fontSize: '11px',
    color: '#8891b8',
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
    color: '#e4e8f5'
  },
  tableContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    overflowX: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    borderRadius: '8px',
    '&::-webkit-scrollbar': { width: '6px', height: '6px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }
  },
  thCell: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#8891b8',
    fontWeight: 700,
    backgroundColor: '#181b28',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  thCellRight: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#8891b8',
    fontWeight: 700,
    backgroundColor: '#181b28',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px',
    whiteSpace: 'nowrap'
  },
  thCellTotal: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#5b7fff',
    fontWeight: 800,
    backgroundColor: '#181b28',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '14px',
    paddingRight: '14px'
  },
  tableRow: {
    '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)' },
    '&:last-child td': { border: 0 }
  },
  monthCell: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#8891b8',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '14px',
    paddingRight: '14px'
  }
}))
