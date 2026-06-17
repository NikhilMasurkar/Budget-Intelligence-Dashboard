import { makeStyles } from 'tss-react/mui'

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
  applyLabel: {
    color: '#8891b8',
    fontWeight: 600,
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '11px'
  },
  applyButtonContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  applyButtonActive: {
    textTransform: 'none',
    fontSize: '11.5px',
    paddingTop: '5px',
    paddingBottom: '5px',
    paddingLeft: '12px',
    paddingRight: '12px',
    borderRadius: '6px',
    fontWeight: 600
  },
  applyButtonInactive: {
    textTransform: 'none',
    fontSize: '11.5px',
    paddingTop: '5px',
    paddingBottom: '5px',
    paddingLeft: '12px',
    paddingRight: '12px',
    borderRadius: '6px',
    fontWeight: 600,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: '#8891b8',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#e4e8f5'
    }
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
