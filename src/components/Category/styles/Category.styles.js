import { makeStyles } from 'tss-react/mui'

export const useCategoryModalStyles = makeStyles()((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      maxWidth: '380px',
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
    backgroundColor: 'rgba(91, 127, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '1px solid rgba(91, 127, 255, 0.25)',
    boxShadow: '0 0 12px rgba(91, 127, 255, 0.1)'
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
  colorPickerLabel: {
    display: 'block',
    color: '#8891b8',
    marginBottom: '6px',
    fontWeight: 600,
    fontSize: '11px'
  },
  colorPickerRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  colorInput: {
    width: '56px',
    height: '36px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
    overflow: 'hidden',
    '&::-webkit-color-swatch-wrapper': { padding: 0 },
    '&::-webkit-color-swatch': { border: 'none' }
  },
  colorPreview: {
    flex: 1,
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '16px',
    paddingRight: '16px'
  },
  colorPreviewText: {
    fontWeight: 700,
    letterSpacing: '0.5px',
    fontSize: '11.5px'
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
    '& .MuiSelect-select': {
      fontSize: '13px'
    }
  }
}))

export const useCategoryManagerStyles = makeStyles()((theme) => ({
  container: {
    width: '100%'
  },
  actionHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  saveButton: {
    paddingTop: '6px',
    paddingBottom: '6px',
    fontWeight: 700,
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(91, 127, 255, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(91, 127, 255, 0.3)'
    }
  },
  reorderButton: {
    paddingTop: '6px',
    paddingBottom: '6px',
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
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  emptyText: {
    color: '#8891b8',
    paddingTop: '40px',
    paddingBottom: '40px',
    paddingLeft: '16px',
    paddingRight: '16px',
    textAlign: 'center',
    fontStyle: 'italic',
    border: '1px dashed',
    borderColor: theme.palette.divider,
    borderRadius: '10px'
  },
  categoryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '10px',
    backgroundColor: '#181b28',
    transition: 'all 0.2s',
    padding: '12px',
    [theme.breakpoints.up('sm')]: {
      padding: '16px'
    }
  },
  reorderControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexShrink: 0
  },
  reorderButtonArrow: {
    padding: '2px',
    color: '#8891b8',
    '&:hover': { color: '#5b7fff' }
  },
  colorDotBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  },
  colorDotInner: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  infoBox: {
    flex: 1,
    minWidth: 0
  },
  categoryName: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#e4e8f5',
    wordBreak: 'break-word'
  },
  categoryType: {
    fontSize: '11px',
    color: '#8891b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
    display: 'block'
  },
  actionsBox: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0
  },
  actionButton: {
    color: '#8891b8',
    '&:hover': { color: '#5b7fff', backgroundColor: 'rgba(91, 127, 255, 0.1)' }
  },
  deleteButton: {
    color: '#8891b8',
    '&:hover': { color: '#ff5f5f', backgroundColor: 'rgba(255, 95, 95, 0.1)' }
  }
}))
