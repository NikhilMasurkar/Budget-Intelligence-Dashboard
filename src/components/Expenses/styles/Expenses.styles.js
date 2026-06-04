import { makeStyles } from 'tss-react/mui'

export const useExpenseTableStyles = makeStyles()((theme) => ({
  container: {
    width: '100%'
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: '16px',
    marginTop: '16px',
    marginBottom: '16px',
    paddingLeft: '8px',
    paddingRight: '8px',
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      alignItems: 'center'
    }
  },
  searchField: {
    maxWidth: '100%',
    marginTop: '8px',
    marginBottom: '8px',
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      maxWidth: '260px'
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.08)'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.15)'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#5b7fff'
      }
    }
  },
  totalText: {
    color: '#8891b8',
    fontSize: '13px',
    textAlign: 'left',
    [theme.breakpoints.up('sm')]: {
      textAlign: 'right'
    }
  },
  tableContainer: {
    backgroundColor: '#181b28',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    backgroundImage: 'none',
    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.25)',
    overflowX: 'auto',
    width: '100%'
  },
  tableHead: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  headerCell: {
    color: '#8891b8',
    fontWeight: 700,
    fontSize: '11px',
    paddingTop: '14px',
    paddingBottom: '14px',
    paddingLeft: '20px',
    paddingRight: '20px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  thCheckboxCell: {
    width: '48px',
    paddingTop: '14px',
    paddingBottom: '14px',
    paddingLeft: '20px',
    paddingRight: '20px'
  },
  checkbox: {
    color: 'rgba(255, 255, 255, 0.3)',
    padding: 0,
    '&.Mui-checked': { color: '#5b7fff' },
    '&.MuiCheckbox-indeterminate': { color: '#5b7fff' }
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    '&:last-child': { borderBottom: 0 },
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.015)' },
    transition: 'background-color 0.15s ease'
  },
  emptyCell: {
    paddingTop: '48px',
    paddingBottom: '48px',
    color: '#8891b8'
  },
  emptyText: {
    fontStyle: 'italic'
  },
  tdCheckboxCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '20px',
    paddingRight: '20px'
  },
  rowCheckbox: {
    color: 'rgba(255, 255, 255, 0.3)',
    padding: 0,
    '&.Mui-checked': { color: '#5b7fff' }
  },
  itemNameCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '20px',
    paddingRight: '20px'
  },
  itemName: {
    fontWeight: 600,
    fontSize: '13.5px',
    color: '#e4e8f5'
  },
  itemNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#8891b8',
    marginTop: '4px',
    fontStyle: 'italic'
  },
  categoryCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '20px',
    paddingRight: '20px'
  },
  categoryChip: {
    fontWeight: 700,
    fontSize: '10.5px',
    borderRadius: '4px'
  },
  categoryFallbackText: {
    color: '#8891b8',
    fontSize: '12px'
  },
  amountCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '20px',
    paddingRight: '20px',
    fontWeight: 700,
    fontSize: '14px',
    color: '#e4e8f5',
    fontVariantNumeric: 'tabular-nums'
  },
  actionsCell: {
    paddingTop: '8px',
    paddingBottom: '8px',
    paddingLeft: '20px',
    paddingRight: '20px'
  },
  actionsContainer: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'flex-end'
  },
  actionButton: {
    color: '#8891b8',
    '&:hover': {
      color: '#5b7fff',
      backgroundColor: 'rgba(91, 127, 255, 0.1)'
    }
  },
  deleteButton: {
    color: '#8891b8',
    '&:hover': {
      color: '#ff5f5f',
      backgroundColor: 'rgba(255, 95, 95, 0.1)'
    }
  }
}))

export const useAddExpenseModalStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '400px',
      width: 'calc(100% - 32px)',
      margin: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.13)',
      backgroundColor: '#101218',
      backgroundImage: 'none',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflow: 'hidden'
    }
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [theme.breakpoints.up('sm')]: {
      padding: '28px'
    }
  },
  iconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 95, 95, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '1px solid rgba(255, 95, 95, 0.25)',
    boxShadow: '0 0 12px rgba(255, 95, 95, 0.1)'
  },
  title: {
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: '24px',
    color: '#e4e8f5',
    letterSpacing: '-0.01em',
    textAlign: 'center'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    marginBottom: '28px'
  },
  rowGrid: {
    display: 'flex',
    gap: '16px'
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },
  saveButton: {
    paddingTop: '9px',
    paddingBottom: '9px',
    fontWeight: 700,
    borderRadius: '8px',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(91, 127, 255, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(91, 127, 255, 0.3)'
    }
  },
  cancelButton: {
    paddingTop: '7px',
    paddingBottom: '7px',
    borderRadius: '8px',
    borderColor: theme.palette.divider,
    color: '#8891b8',
    fontSize: '13px',
    fontWeight: 600,
    '&:hover': {
      borderColor: '#e4e8f5',
      color: '#e4e8f5',
      backgroundColor: 'rgba(255, 255, 255, 0.03)'
    }
  },
  fieldStyles: {
    '& .MuiInputLabel-root': {
      fontSize: '13px'
    },
    '& .MuiInputBase-input': {
      fontSize: '13px'
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '2px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.08)'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.15)'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#5b7fff'
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#5b7fff'
    },
    '& select': {
      fontSize: '13px',
      paddingLeft: '12px',
      backgroundColor: '#181b28',
      color: '#e4e8f5'
    },
    '& option': {
      fontSize: '13px',
      backgroundColor: '#181b28',
      color: '#e4e8f5'
    }
  }
}))

export const useTopExpensesTableStyles = makeStyles()((theme) => ({
  container: {
    backgroundColor: '#101218',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    [theme.breakpoints.up('sm')]: {
      padding: '20px'
    }
  },
  title: {
    fontWeight: 800,
    fontSize: '16px',
    marginBottom: '4px',
    color: '#e4e8f5'
  },
  subtitle: {
    fontSize: '12px',
    color: '#8891b8',
    marginBottom: '18px'
  },
  tableContainer: {
    backgroundColor: '#181b28',
    backgroundImage: 'none',
    borderRadius: '8px',
    boxShadow: 'none',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    overflowX: 'auto',
    '&::-webkit-scrollbar': { height: '6px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }
  },
  tableHead: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  headerCell: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#8891b8',
    fontWeight: 700,
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  tableRow: {
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.015) !important' },
    '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.04)' },
    '&:last-child td': { border: 0 }
  },
  emptyCell: {
    paddingTop: '32px',
    paddingBottom: '32px',
    color: '#8891b8',
    fontSize: '13px'
  },
  itemCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  itemNameBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  itemName: {
    fontWeight: 600,
    fontSize: '13px',
    color: '#e4e8f5'
  },
  moreChip: {
    height: '18px',
    fontSize: '9.5px',
    fontWeight: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#8891b8',
    borderRadius: '4px'
  },
  categoryChipCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  categoryChip: {
    fontSize: '10px',
    fontWeight: 800,
    borderRadius: '4px'
  },
  totalCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    fontSize: '13px',
    color: '#e4e8f5'
  },
  avgCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    color: '#8891b8',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '13px'
  },
  progressCell: {
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  progressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  progress: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  pctText: {
    fontSize: '12.5px',
    color: '#8891b8',
    minWidth: '32px',
    fontVariantNumeric: 'tabular-nums'
  }
}))
